
"use client";

import type { DeedData, NewCreature, Role, Deed, DeedTier, DeedActionType, DeedType, DeedVersus } from './types';
import { addCreature, addDeed, getAllDeeds } from './idb';
import { getStatsForRoleAndLevel } from './roles';

interface LegacyCreature {
    monsterName: string;
    role: Role;
    level: number | string;
    tr: number | string;
    hp: number | string;
    spd: number | string;
    init: number | string;
    acc: number | string;
    grd: number | string;
    res: number | string;
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

    // Split deeds by one or more blank lines
    const deedStrings = deedBlock.trim().split(/\n\s*\n/);
    
    return deedStrings.map(deedStr => {
        const lines = deedStr.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return null;

        const name = lines[0];
        if (name.length > 50) return null; // Sanity check for a deed name

        const typeLineRaw = lines[1];
        
        let deedType: DeedType;
        let actionType: DeedActionType;
        let versus: DeedVersus;

        let typeMatch = typeLineRaw.toUpperCase().match(/(\w+)\s+(ATTACK|SUPPORT)\s+VS\.?\s+(\w+|[0-9]+)/);
        
        if (typeMatch) {
            deedType = typeMatch[1].toLowerCase() as DeedType;
            actionType = typeMatch[2].toLowerCase() as DeedActionType;
            versus = typeMatch[3].toLowerCase() as DeedVersus;
        } else {
            const typeMatchWithoutVs = typeLineRaw.toUpperCase().match(/(\w+)\s+(ATTACK|SUPPORT)/);
            if (typeMatchWithoutVs) {
                deedType = typeMatchWithoutVs[1].toLowerCase() as DeedType;
                actionType = typeMatchWithoutVs[2].toLowerCase() as DeedActionType;
                if (actionType === 'support') {
                    versus = '10';
                } else { // It's an attack
                    versus = 'guard';
                }
            } else {
                 console.warn('Failed to parse deed type line -> ', typeLineRaw);
                 return null;
            }
        }
        
        let lineIndex = 2;
        let target = '';
        
        // Check if the next line is a Target/Range/Area line
        if (lines[lineIndex] && (
            lines[lineIndex].toLowerCase().startsWith('target:') || 
            lines[lineIndex].toLowerCase().startsWith('range:') || 
            lines[lineIndex].toLowerCase().startsWith('area:'))) {
            
            target = lines[lineIndex].split('|').map(p => {
                const parts = p.split(':');
                return parts.length > 1 ? parts.slice(1).join(':').trim() : parts[0].trim();
            }).join(' | ');
            
            lineIndex++;
        }

        const effectLines = lines.slice(lineIndex);

        // Parse Effects
        const effects: DeedData['effects'] = {};
        let currentEffectKey: keyof DeedData['effects'] | null = null;
        
        for (const line of effectLines) {
             const match = line.match(/^(Start|Base|Hit|Shadow|End):\s*(.*)$/i);
             if (match) {
                 const effectName = match[1].toLowerCase() as keyof DeedData['effects'];
                 const effectValue = match[2].trim();
                 effects[effectName] = (effects[effectName] ? `${effects[effectName]}\n` : '') + effectValue;
                 currentEffectKey = effectName;
             } else if (currentEffectKey) {
                 // Append to the last seen effect type if it's a multi-line description
                 effects[currentEffectKey] += '\n' + line;
             } else {
                 // If no effect key has been set yet, assume it's part of the 'Hit' effect.
                 effects.hit = (effects.hit ? `${effects.hit}\n` : '') + line;
                 currentEffectKey = 'hit';
             }
        }

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
        // Coerce level and other numeric fields from potential strings
        const level = Number(legacy.level) || 1;
        const tr = Number(legacy.tr) || 0;
        const hp = Number(legacy.hp) || 1;
        const spd = Number(legacy.spd) || 0;
        const init = Number(legacy.init) || 0;
        const acc = Number(legacy.acc) || 0;
        const grd = Number(legacy.grd) || 0;
        const res = Number(legacy.res) || 0;


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
            level: level,
            template: 'Normal', // Legacy data doesn't have templates
            TR: tr,
            attributes: {
                HP: hp,
                Speed: spd,
                Initiative: init,
                Accuracy: acc,
                Guard: grd,
                Resist: res,
                rollBonus: parseInt((legacy.roll || '0').replace('+', ''), 10) || 0,
                DMG: getStatsForRoleAndLevel(legacy.role, level)?.DMG || 'd6',
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
