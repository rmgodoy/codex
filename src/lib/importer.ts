
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

    // A new deed starts with a line that is likely a name (all caps, spaces, hyphens, apostrophes).
    const deedStrings = deedBlock.trim().split(/\n(?=[A-Z][A-Z\s'-]+$)/m);
    
    return deedStrings.map(deedStr => {
        const lines = deedStr.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return null;

        const name = lines[0];
        if (name.length > 50) return null; // Sanity check for a deed name

        // Line 1 should be the type line, which might also contain target info
        const typeLineRaw = lines[1];
        const typeLineParts = typeLineRaw.split('|').map(p => p.trim());
        const actualTypeLine = typeLineParts[0];

        const typeMatch = actualTypeLine.toUpperCase().match(/(\w+)\s+(ATTACK|SUPPORT)\s+VS\.?\s+(\w+|[0-9]+)/);
        if (!typeMatch) return null;

        const deedType = typeMatch[1].toLowerCase() as DeedType;
        const actionType = typeMatch[2].toLowerCase() as DeedActionType;
        const versus = typeMatch[3].toLowerCase() as DeedVersus;

        const remainingLines = lines.slice(2);

        // Parse Target/Range/Area
        const targetParts: string[] = [];
        if (typeLineParts.length > 1) {
            targetParts.push(typeLineParts.slice(1).join(' | '));
        }

        const effectLines: string[] = [];
        let targetParsingDone = false;

        for (const line of remainingLines) {
            const lowerLine = line.toLowerCase();
            if (!targetParsingDone && (lowerLine.startsWith('target:') || lowerLine.startsWith('range:') || lowerLine.startsWith('area:'))) {
                targetParts.push(line.substring(line.indexOf(':') + 1).trim());
            } else {
                targetParsingDone = true;
                effectLines.push(line);
            }
        }
        const target = targetParts.join(' | ');

        // Parse Effects
        const effects: DeedData['effects'] = { hit: '' };
        let inEffect: keyof DeedData['effects'] | null = null;
        
        for (const line of effectLines) {
             const match = line.match(/^(Start|Base|Hit|Shadow|End):\s*(.*)$/i);
             if (match) {
                 const effectName = match[1].toLowerCase() as keyof DeedData['effects'];
                 const effectValue = match[2].trim();
                 effects[effectName] = (effects[effectName] ? `${effects[effectName]}\n` : '') + effectValue;
                 inEffect = effectName;
             } else if (inEffect) {
                 // Multi-line effect value
                 effects[inEffect] += '\n' + line;
             } else if (!effects.hit) {
                 // If we find a line that is not a recognized effect start, and we haven't found a hit yet, assume it is Hit
                 effects.hit = line;
                 inEffect = 'hit';
             } else {
                // If we already have a hit and this is not a prefixed effect, it's likely a multiline part of the previous effect.
                // The 'inEffect' logic should already handle this. If inEffect is null here, something is odd.
                // We'll just append to hit to be safe.
                effects.hit += '\n' + line;
             }
        }

        if (!effects.hit) return null; // Hit is mandatory

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
