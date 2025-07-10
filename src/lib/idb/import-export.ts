
"use client";

import type { Creature, Deed, Encounter, EncounterTable, Tag, Treasure, AlchemicalItem, Room, Dungeon, Item, Faction, Npc, TagSource, CreatureAbility, Calendar, CalendarEvent, Map, PantheonEntity, Path, WorldMetadata } from '@/lib/types';
import { getDb, generateId, DB_NAME, DB_VERSION, ALL_STORE_NAMES, WORLDS_METADATA_STORE_NAME, setWorldDbName } from './db';

// Import/Export
export const exportWorldData = async (worldName: string): Promise<any> => {
    setWorldDbName(worldName);
    const db = await getDb();
    
    const transaction = db.transaction(ALL_STORE_NAMES, 'readonly');
    
    const promises = ALL_STORE_NAMES.map(name => {
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

    const tx = db.transaction(ALL_STORE_NAMES, 'readwrite');
    
    const stores: { [key: string]: IDBObjectStore } = {};
    ALL_STORE_NAMES.forEach(name => {
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

    const processStore = (storeName: string, items: any[]) => {
        if (items && Array.isArray(items)) {
            items.forEach((item: any) => {
                stores[storeName].put(item);
                if ('tags' in item) {
                    processTags(item.tags, storeName as TagSource);
                }
            });
        }
    };

    ALL_STORE_NAMES.forEach(storeName => {
        if(storeName !== WORLDS_METADATA_STORE_NAME) { // metadata is not a regular store
             processStore(storeName, data[storeName]);
        }
    });
    
    allTagsToCreate.forEach(tag => {
        stores.tags.put(tag);
    });
    
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

