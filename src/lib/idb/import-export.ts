

"use client";

import type { Creature, Deed, Encounter, EncounterTable, Tag, Treasure, AlchemicalItem, Room, Dungeon, TagSource, MapData } from '@/lib/types';
import { getDb, CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, TAGS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME, ALCHEMY_ITEMS_STORE_NAME, ROOMS_STORE_NAME, DUNGEONS_STORE_NAME, MAPS_STORE_NAME } from './db';

// Import/Export
export const exportAllData = async (): Promise<any> => {
    const db = await getDb();
    const storeNames = [CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, TAGS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME, ALCHEMY_ITEMS_STORE_NAME, ROOMS_STORE_NAME, DUNGEONS_STORE_NAME, MAPS_STORE_NAME];
    const transaction = db.transaction(storeNames, 'readonly');
    
    const promises = storeNames.map(name => {
      return new Promise((resolve, reject) => {
        const request = transaction.objectStore(name).getAll();
        request.onsuccess = () => resolve({ name, data: request.result });
        request.onerror = () => reject(request.error);
      });
    });

    const resultsArray = await Promise.all(promises);
    const results: Record<string, any> = {};
    resultsArray.forEach((res: any) => {
      results[res.name] = res.data;
    });

    return results;
};

export const importData = async (data: any): Promise<void> => {
    const db = await getDb();

    if (typeof data !== 'object' || data === null) {
        return Promise.reject(new Error("Invalid import file format. Expected an object with arrays of data."));
    }

    const storeNames = [CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, TAGS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME, ALCHEMY_ITEMS_STORE_NAME, ROOMS_STORE_NAME, DUNGEONS_STORE_NAME, MAPS_STORE_NAME];
    const tx = db.transaction(storeNames, 'readwrite');
    
    const stores: { [key: string]: IDBObjectStore } = {};
    storeNames.forEach(name => {
      stores[name] = tx.objectStore(name);
      stores[name].clear();
    });

    const allTagsToCreate = new Map<string, Tag>();

    const processTags = (tags: string[] | undefined, source: TagSource) => {
        if (tags && Array.isArray(tags)) {
            tags.forEach(tagName => {
                const key = `${tagName}|${source}`;
                if (!allTagsToCreate.has(key)) {
                    allTagsToCreate.set(key, { name: tagName, source });
                }
            });
        }
    };

    if (data.creatures && Array.isArray(data.creatures)) {
        data.creatures.forEach((item: Creature) => {
            stores[CREATURES_STORE_NAME].put(item);
            processTags(item.tags, 'creature');
        });
    }
    if (data.deeds && Array.isArray(data.deeds)) {
        data.deeds.forEach((item: Deed) => {
            stores[DEEDS_STORE_NAME].put(item);
            processTags(item.tags, 'deed');
        });
    }
    if (data.encounters && Array.isArray(data.encounters)) {
        data.encounters.forEach((item: Encounter) => {
            stores[ENCOUNTERS_STORE_NAME].put(item);
            processTags(item.tags, 'encounter');
        });
    }
    if (data.encounterTables && Array.isArray(data.encounterTables)) {
        data.encounterTables.forEach((item: EncounterTable) => {
            stores[ENCOUNTER_TABLES_STORE_NAME].put(item);
            processTags(item.tags, 'encounterTable');
        });
    }
    if (data.treasures && Array.isArray(data.treasures)) {
        data.treasures.forEach((item: Treasure) => {
            stores[TREASURES_STORE_NAME].put(item);
            processTags(item.tags, 'treasure');
        });
    }
    if (data.alchemicalItems && Array.isArray(data.alchemicalItems)) {
        data.alchemicalItems.forEach((item: AlchemicalItem) => {
            stores[ALCHEMY_ITEMS_STORE_NAME].put(item);
            processTags(item.tags, 'alchemicalItem');
        });
    }
    if (data.rooms && Array.isArray(data.rooms)) {
        data.rooms.forEach((item: Room) => {
            stores[ROOMS_STORE_NAME].put(item);
            processTags(item.tags, 'room');
        });
    }
    if (data.dungeons && Array.isArray(data.dungeons)) {
        data.dungeons.forEach((item: Dungeon) => {
            stores[DUNGEONS_STORE_NAME].put(item);
            processTags(item.tags, 'dungeon');
        });
    }
    if (data.maps && Array.isArray(data.maps)) {
        data.maps.forEach((item: MapData) => {
            stores[MAPS_STORE_NAME].put(item);
            processTags(item.tags, 'map');
        });
    }
    
    allTagsToCreate.forEach(tag => {
        stores[TAGS_STORE_NAME].put(tag);
    });
    
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};
