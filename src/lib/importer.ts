
"use client";

import type { DeedData, NewCreature, Role, Deed, DeedTier, DeedActionType, DeedType, DeedVersus } from './types';
import { addCreature, addDeed, getAllDeeds } from './idb';
import { getStatsForRoleAndLevel } from './roles';

interface LegacyCreature {
    monsterName: string;
    role: Role;
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
    lightDeeds: string;
    heavyDeeds: string;
    mightyDeeds: string;
}

function parseDeedBlock(deedBlock: string, tier: DeedTier): DeedData[] {
    if (typeof deedBlock !== 'string' || !deedBlock.trim()) {
        return [];
    }

    const deedStrings = deedBlock.trim().split(/\n(?=[A-Z\s'-]+$)/m);
    
    return deedStrings.map(deedStr => {
        const lines = deedStr.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 3) return null;

        const name = lines[0];
        
        const typeLineParts = lines[1].toUpperCase().split(/\sVS\s|\s+/);
        const deedType = typeLineParts[0]?.toLowerCase() as DeedType;
        const actionType = typeLineParts[1]?.toLowerCase() as DeedActionType;
        const versus = typeLineParts[2]?.toLowerCase() as DeedVersus;
        
        if (!deedType || !actionType || !versus) return null;

        const targetLine = lines.find(l => l.toLowerCase().startsWith('target:')) || '';
        const target = targetLine.replace(/target:\s*/i, '');
        
        const effects: DeedData['effects'] = { hit: '' };
        
        const effectLines = lines.slice(2).filter(l => !l.toLowerCase().startsWith('target:'));
        
        for (const line of effectLines) {
            const match = line.match(/^(Start|Base|Hit|Shadow|End):\s*(.*)$/i);
            if (match) {
                const effectName = match[1].toLowerCase() as keyof DeedData['effects'];
                const effectValue = match[2];
                if (effectName) {
                   effects[effectName] = effectValue;
                }
            }
        }
        
        if (!effects.hit) return null;

        return {
            name,
            tier,
            actionType,
            deedType,
            versus,
            target,
            effects,
            tags: []
        };
    }).filter((d): d is DeedData => d !== null);
}


export async function importLegacyData(jsonString: string): Promise<{ creaturesAdded: number; deedsAdded: number }> {
    let legacyCreatures: LegacyCreature[];
    try {
      legacyCreatures = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("Invalid JSON file.");
    }

    if (!Array.isArray(legacyCreatures)) {
        throw new Error("Invalid JSON format: Expected an array of creatures.");
    }

    let creaturesAdded = 0;
    let deedsAdded = 0;

    const existingDeeds = await getAllDeeds();
    const existingDeedMap = new Map(existingDeeds.map(d => [`${d.name.toLowerCase().trim()}|${d.tier}`, d]));

    for (const legacy of legacyCreatures) {
        const allParsedDeeds: DeedData[] = [
            ...parseDeedBlock(legacy.lightDeeds, 'light'),
            ...parseDeedBlock(legacy.heavyDeeds, 'heavy'),
            ...parseDeedBlock(legacy.mightyDeeds, 'mighty'),
        ];
        
        const creatureDeedIds: string[] = [];
        for (const parsedDeed of allParsedDeeds) {
            const mapKey = `${parsedDeed.name.toLowerCase().trim()}|${parsedDeed.tier}`;
            let deed = existingDeedMap.get(mapKey);

            if (!deed) {
                const newId = await addDeed(parsedDeed);
                deedsAdded++;
                deed = { ...parsedDeed, id: newId };
                existingDeedMap.set(mapKey, deed);
            }
            creatureDeedIds.push(deed.id);
        }

        const creatureToSave: NewCreature = {
            name: legacy.monsterName,
            role: legacy.role,
            level: legacy.level,
            template: 'Normal',
            TR: legacy.tr,
            attributes: {
                HP: legacy.hp,
                Speed: legacy.spd,
                Initiative: legacy.init,
                Accuracy: legacy.acc,
                Guard: legacy.grd,
                Resist: legacy.res,
                rollBonus: parseInt(legacy.roll.replace('+', ''), 10) || 0,
                DMG: getStatsForRoleAndLevel(legacy.role, legacy.level)?.DMG || 'd6',
            },
            abilities: Object.entries(legacy.features || {}).map(([name, desc]) => `**${name}:** ${desc}`).join('\n\n'),
            description: '',
            tags: [],
            deeds: creatureDeedIds,
        };

        await addCreature(creatureToSave);
        creaturesAdded++;
    }

    return { creaturesAdded, deedsAdded };
}
