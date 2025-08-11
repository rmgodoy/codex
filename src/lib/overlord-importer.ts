
"use client";

import type { DeedData, NewCreature, Role, Deed, DeedTier, DeedActionType, DeedType, DeedVersus, CreatureTemplate } from './types';
import { addCreature, addDeed, getDeedById, getCreatureById } from '@/lib/idb';

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
    features: { [key: string]: string };
    lightDeeds?: string;
    heavyDeeds?: string;
    mightyDeeds?: string;
    tyrantDeeds?: string;
    bundleId: string;
    statblockID: string;
}

const parseDeedBlock = (deedBlock: string | undefined, tier: DeedTier, creatureId: string, bundleId: string): { deedData: DeedData, deedId: string }[] => {
    if (typeof deedBlock !== 'string' || !deedBlock.trim()) {
        return [];
    }

    const deedStrings = deedBlock.trim().split(/\n\s*\n/);
    
    return deedStrings.map(deedStr => {
        const lines = deedStr.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return null;

        const name = lines[0];
        if (name.length > 50) return null;

        const typeLineRaw = lines[1];
        let deedType: DeedType;
        let actionType: DeedActionType;
        let versus: DeedVersus;
        let target = '';
        let incompatibleEffects = '';

        const typeMatch = typeLineRaw.toUpperCase().match(/(\w+)\s+(ATTACK|SUPPORT)\s+VS\.?\s+(\w+|[0-9]+)/);
        
        if (typeMatch) {
            deedType = typeMatch[1].toLowerCase() as DeedType;
            actionType = typeMatch[2].toLowerCase() as DeedActionType;
            versus = typeMatch[3].toLowerCase() as DeedVersus;
        } else {
             console.warn('Failed to parse deed type line -> ', typeLineRaw);
             return null;
        }
        
        let lineIndex = 2;
        if (lines[lineIndex] && (
            lines[lineIndex].toLowerCase().startsWith('target:') || 
            lines[lineIndex].toLowerCase().startsWith('range:') || 
            lines[lineIndex].toLowerCase().startsWith('area:'))) {
            target = lines[lineIndex].split(':').slice(1).join(':').trim();
            lineIndex++;
        }

        const effectLines = lines.slice(lineIndex);
        const effects: DeedData['effects'] = {};
        
        for (const line of effectLines) {
            const match = line.match(/^(Start|Base|Hit|Spark|Shadow|After):\s*(.*)$/i);
            if (match) {
                const effectName = match[1].toLowerCase() as keyof DeedData['effects'];
                const effectValue = match[2].trim();
                effects[effectName] = (effects[effectName] ? `${effects[effectName]}\n` : '') + effectValue;
            } else {
                incompatibleEffects += `${line}\n`;
            }
        }
        
        if (incompatibleEffects) {
            effects.hit = (effects.hit || '') + `\n${name} also has the following effects:\n${incompatibleEffects}`;
        }

        const deedId = `${bundleId}-${creatureId}-${name.replace(/\s+/g, '-')}`;

        return {
            deedId,
            deedData: {
                name,
                tier,
                actionType,
                deedType,
                versus,
                target,
                effects,
                tags: []
            }
        };
    }).filter((d): d is { deedData: DeedData; deedId: string } => d !== null);
}

export async function importOverlordBundle(jsonString: string): Promise<{ creaturesAdded: number; deedsAdded: number }> {
    let bundle: OverlordCreature[];
    try {
      bundle = JSON.parse(jsonString);
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
        
        const allParsedDeeds = [
            ...parseDeedBlock(legacy.lightDeeds, 'light', legacy.statblockID, legacy.bundleId),
            ...parseDeedBlock(legacy.heavyDeeds, 'heavy', legacy.statblockID, legacy.bundleId),
            ...parseDeedBlock(legacy.mightyDeeds, 'mighty', legacy.statblockID, legacy.bundleId),
            ...parseDeedBlock(legacy.tyrantDeeds, 'tyrant', legacy.statblockID, legacy.bundleId),
        ];
        
        const creatureDeedIds: string[] = [];
        for (const { deedId, deedData } of allParsedDeeds) {
            const existingDeed = await getDeedById(deedId);
            if (!existingDeed) {
                await addDeed({ ...deedData, id: deedId });
                deedsAdded++;
            }
            creatureDeedIds.push(deedId);
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
            abilities: Object.entries(legacy.features || {}).map(([name, description]) => ({ id: crypto.randomUUID(), name, description })),
            description: '',
            tags: [],
            deeds: creatureDeedIds,
        };

        await addCreature(creatureToSave);
        creaturesAdded++;
    }

    return { creaturesAdded, deedsAdded };
}
