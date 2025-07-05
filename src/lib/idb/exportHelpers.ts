
"use client";

import type { CreatureWithDeeds, Deed } from '@/lib/types';
import { getCreaturesByIds } from './creatures';
import { getDeedsByIds } from './deeds';

export const getCreaturesWithDeedsByIds = async (ids: string[]): Promise<CreatureWithDeeds[]> => {
    if (!ids || ids.length === 0) return [];
    
    const creatures = await getCreaturesByIds(ids);
    if (creatures.length === 0) return [];

    const allDeedIds = [...new Set(creatures.flatMap(c => c.deeds))];
    const deeds = await getDeedsByIds(allDeedIds);
    const deedsMap = new Map(deeds.map(d => [d.id, d]));

    return creatures.map(c => ({
        ...c,
        deeds: c.deeds.map(id => deedsMap.get(id)).filter((d): d is Deed => !!d)
    }));
};
