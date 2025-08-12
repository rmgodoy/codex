
"use client";

import type { DeedData, NewCreature, Role, Deed, DeedTier, DeedActionType, DeedType, DeedVersus, CreatureTemplate, CreatureAbility } from './types';
import { addCreature, addDeed, getDeedById, getCreatureById } from '@/lib/idb';

type OverlordFeatureV1 = { [key: string]: string };
type OverlordFeatureV2 = { title: string; content: string };

type OverlordDeedV1 = string;
type OverlordDeedV2 = {
    title: string;
    lines: {
        title: string;
        content: string;
    }[];
};

interface OverlordCreature {
    monsterName: string;
    role: Role;
    template: CreatureTemplate;
    level: number;
    tr: number;
    hp: number;
    spd: number;
    init: number;
    acc: number;
    grd: number;
    res: number;
    roll: string;
    features: OverlordFeatureV1 | OverlordFeatureV2[];
    lightDeeds?: OverlordDeedV1 | OverlordDeedV2[];
    heavyDeeds?: OverlordDeedV1 | OverlordDeedV2[];
    mightyDeeds?: OverlordDeedV1 | OverlordDeedV2[];
    tyrantDeeds?: OverlordDeedV1 | OverlordDeedV2[];
    bundleId: string;
    statblockID: string;
}

const parseDeedFromObject = (deedObj: OverlordDeedV2, tier: DeedTier, creatureId: string, bundleId: string): { deedData: DeedData; deedId: string } | null => {
    const name = deedObj.title;
    if (name.length > 100) return null;
    
    const deedId = `${bundleId}-${creatureId}-${name.replace(/\s+/g, '-')}`;

    const typeLine = deedObj.lines.find(line => line.title.includes("ATTACK") || line.title.includes("SUPPORT"));
    if (!typeLine) return null;
    
    const typeMatch = typeLine.title.toUpperCase().match(/(\w+)\s+(ATTACK|SUPPORT)(?:\s+VS\.?\s+(\w+|[0-9]+))?/);
    if (!typeMatch) return null;

    const deedType = typeMatch[1].toLowerCase() as DeedType;
    const actionType = typeMatch[2].toLowerCase() as DeedActionType;
    const versus = (typeMatch[3] ? typeMatch[3].toLowerCase() : 'special') as DeedVersus;

    const effects: DeedData['effects'] = {};
    let target = '';

    for (const line of deedObj.lines) {
        const titleLower = line.title.toLowerCase();
        if (titleLower.includes('vs.')) continue;
        
        if (['target', 'range', 'area'].includes(titleLower)) {
            target = `${target ? `${target} | ` : ''}${line.content}`;
        } else if (['start', 'base', 'hit', 'spark', 'shadow', 'after', 'special'].includes(titleLower)) {
            const effectKey = titleLower === 'special' ? 'hit' : titleLower as keyof DeedData['effects'];
            effects[effectKey] = (effects[effectKey] ? `${effects[effectKey]}\n` : '') + line.content;
        }
    }
    
    return {
        deedId,
        deedData: { name, tier, actionType, deedType, versus, target, effects, tags: [] }
    };
}


const parseDeedFromString = (deedStr: string, tier: DeedTier, creatureId: string, bundleId: string): { deedData: DeedData, deedId: string }[] => {
    if (typeof deedStr !== 'string' || !deedStr.trim()) return [];
    
    const deedStrings = deedStr.trim().split(/\n\s*\n/);
    
    return deedStrings.map(deed => {
        const lines = deed.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return null;

        const name = lines[0];
        if (name.length > 50) return null;
        
        const deedId = `${bundleId}-${creatureId}-${name.replace(/\s+/g, '-')}`;
        
        const typeLineRaw = lines[1];
        const typeMatch = typeLineRaw.toUpperCase().match(/(\w+)\s+(ATTACK|SUPPORT)(?:\s+VS\.?\s+(\w+|[0-9]+))?/);
        if (!typeMatch) return null;
        
        const deedType = typeMatch[1].toLowerCase() as DeedType;
        const actionType = typeMatch[2].toLowerCase() as DeedActionType;
        const versus = (typeMatch[3] ? typeMatch[3].toLowerCase() : 'special') as DeedVersus;
        
        let lineIndex = 2;
        let target = '';
        if (lines[lineIndex] && (lines[lineIndex].toLowerCase().startsWith('target:') || lines[lineIndex].toLowerCase().startsWith('range:') || lines[lineIndex].toLowerCase().startsWith('area:'))) {
            target = lines[lineIndex].split(':').slice(1).join(':').trim();
            lineIndex++;
        }

        const effects: DeedData['effects'] = {};
        for (const line of lines.slice(lineIndex)) {
            const match = line.match(/^(Start|Base|Hit|Spark|Shadow|After):\s*(.*)$/i);
            if (match) {
                const effectName = match[1].toLowerCase() as keyof DeedData['effects'];
                effects[effectName] = (effects[effectName] ? `${effects[effectName]}\n` : '') + match[2].trim();
            } else if (effects.hit) {
                effects.hit += `\n${line}`;
            } else {
                effects.hit = line;
            }
        }
        
        return { deedId, deedData: { name, tier, actionType, deedType, versus, target, effects, tags: [] } };
    }).filter((d): d is { deedData: DeedData; deedId: string } => d !== null);
}

export async function importOverlordBundle(jsonString: string): Promise<{ creaturesAdded: number; deedsAdded: number }> {
    let bundle: OverlordCreature[];
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.statblocks)) {
        bundle = data.statblocks;
      } else if (Array.isArray(data)) {
        // For backwards compatibility with the old format
        bundle = data;
      } else {
        throw new Error("Invalid JSON format: Expected a 'statblocks' array.");
      }
    } catch (e) {
      throw new Error("Invalid JSON file.");
    }

    if (!Array.isArray(bundle)) {
        throw new Error("Invalid JSON format: Expected an array of creatures.");
    }

    let creaturesAdded = 0;
    let deedsAdded = 0;

    for (const legacy of bundle) {
        const creatureId = `${legacy.bundleId}-${legacy.statblockID}`;
        const existingCreature = await getCreatureById(creatureId);

        if (existingCreature) {
            console.log(`Creature ${legacy.monsterName} (${creatureId}) already exists. Skipping.`);
            continue;
        }
        
        let allParsedDeeds: { deedData: DeedData, deedId: string }[] = [];

        const processDeeds = (deeds: OverlordDeedV1 | OverlordDeedV2[] | undefined, tier: DeedTier) => {
            if (typeof deeds === 'string') {
                allParsedDeeds.push(...parseDeedFromString(deeds, tier, legacy.statblockID, legacy.bundleId));
            } else if (Array.isArray(deeds)) {
                deeds.forEach(deedObj => {
                    const parsed = parseDeedFromObject(deedObj, tier, legacy.statblockID, legacy.bundleId);
                    if (parsed) allParsedDeeds.push(parsed);
                });
            }
        };

        processDeeds(legacy.lightDeeds, 'light');
        processDeeds(legacy.heavyDeeds, 'heavy');
        processDeeds(legacy.mightyDeeds, 'mighty');
        processDeeds(legacy.tyrantDeeds, 'tyrant');
        
        const creatureDeedIds: string[] = [];
        for (const { deedId, deedData } of allParsedDeeds) {
            const existingDeed = await getDeedById(deedId);
            if (!existingDeed) {
                await addDeed({ ...deedData, id: deedId });
                deedsAdded++;
            }
            creatureDeedIds.push(deedId);
        }

        let abilities: CreatureAbility[] = [];
        if (Array.isArray(legacy.features)) {
            abilities = legacy.features.map(f => ({ id: crypto.randomUUID(), name: f.title, description: f.content }));
        } else if (typeof legacy.features === 'object') {
            abilities = Object.entries(legacy.features || {}).map(([name, description]) => ({ id: crypto.randomUUID(), name, description }));
        }

        const creatureToSave: NewCreature = {
            id: creatureId,
            name: legacy.monsterName,
            role: legacy.role,
            template: legacy.template || 'Normal',
            level: Number(legacy.level),
            TR: Number(legacy.tr),
            attributes: {
                HP: Number(legacy.hp),
                Speed: Number(legacy.spd),
                Initiative: Number(legacy.init),
                Accuracy: Number(legacy.acc),
                Guard: Number(legacy.grd),
                Resist: Number(legacy.res),
                rollBonus: parseInt((legacy.roll || '0').replace('+', ''), 10),
                DMG: 'd6', // This needs to be calculated based on level/role, placeholder for now
            },
            abilities,
            description: '',
            tags: [],
            deeds: creatureDeedIds,
        };

        await addCreature(creatureToSave);
        creaturesAdded++;
    }

    return { creaturesAdded, deedsAdded };
}
