
"use client";

import type { CreatureWithDeeds, Deed, CreatureAbility } from '@/lib/types';
import { getCreaturesByIds } from './creatures';
import { getDeedsByIds } from './deeds';

export const getCreaturesWithDeedsByIds = async (ids: string[]): Promise<CreatureWithDeeds[]> => {
    if (!ids || ids.length === 0) return [];
    
    const creatures = await getCreaturesByIds(ids);
    if (creatures.length === 0) return [];

    const allDeedIds = [...new Set(creatures.flatMap(c => c.deeds))];
    const deeds = await getDeedsByIds(allDeedIds);
    const deedsMap = new Map(deeds.map(d => [d.id, d]));

    return creatures.map(c => {
        let abilitiesAsArray: CreatureAbility[] = [];
        if (typeof (c as any).abilities === 'string' && (c as any).abilities.length > 0) {
            abilitiesAsArray = (c as any).abilities.split('\n\n').map((abilityStr: string) => {
                const match = abilityStr.match(/\*\*(.*?):\*\*\s*(.*)/s);
                if (match && match[1] && match[2]) {
                    return { id: crypto.randomUUID(), name: match[1], description: match[2].trim() };
                }
                if (!match && abilityStr.trim()) {
                    return { id: crypto.randomUUID(), name: 'Ability', description: abilityStr.trim() };
                }
                return null;
            }).filter((a: any): a is CreatureAbility => a !== null);
        } else if (Array.isArray(c.abilities)) {
            abilitiesAsArray = c.abilities.map(a => ({...a, id: a.id || crypto.randomUUID()}));
        }

        return {
            ...c,
            abilities: abilitiesAsArray,
            deeds: c.deeds.map(id => deedsMap.get(id)).filter((d): d is Deed => !!d)
        }
    });
};
