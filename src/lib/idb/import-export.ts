
"use client";

import { getDb, ALL_STORE_NAMES, setWorldDbName, generateId, WORLDS_METADATA_STORE_NAME } from './db';
import type { TagSource, WorldMetadata } from '@/lib/types';


// Import/Export
export const exportWorldData = async (worldSlug: string): Promise<any> => {
    setWorldDbName(worldSlug);
    const db = await getDb();
    
    const storeNamesToExport = ALL_STORE_NAMES;
    const transaction = db.transaction(storeNamesToExport, 'readonly');
    
    const promises = storeNamesToExport.map(name => {
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

export const importData = async (data: any, newWorldName?: string): Promise<void> => {
    const db = await getDb();
    const slug = db.name.replace("TresspasserDB_", "");

    if (typeof data !== 'object' || data === null) {
        return Promise.reject(new Error("Invalid import file format. Expected an object with arrays of data."));
    }
    
    // If importing a new world, we must also create its metadata entry.
    if (newWorldName) {
      const metaDbRequest = indexedDB.open("TresspasserWorldsMetadata", 1);
      await new Promise<void>((resolve, reject) => {
        metaDbRequest.onsuccess = () => {
          const metaDb = metaDbRequest.result;
          const tx = metaDb.transaction(WORLDS_METADATA_STORE_NAME, "readwrite");
          const store = tx.objectStore(WORLDS_METADATA_STORE_NAME);
          const newMetadata: WorldMetadata = {
            slug,
            name: newWorldName,
            description: "Imported from file."
          };
          store.put(newMetadata);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        metaDbRequest.onerror = () => reject(metaDbRequest.error);
      });
    }

    const storeNamesToImport = ALL_STORE_NAMES;
    const tx = db.transaction(storeNamesToImport, 'readwrite');
    
    const stores: { [key: string]: IDBObjectStore } = {};
    storeNamesToImport.forEach(name => {
      stores[name] = tx.objectStore(name);
      stores[name].clear();
    });

    const allTagsToCreate = new Map<string, {name: string, source: TagSource}>();

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
                if (!item.id) {
                    item.id = generateId();
                }

                // Handle legacy calendar data
                if (storeName === 'calendars' && !('modelId' in item)) {
                  item.modelId = undefined;
                }
                
                // Ensure abilities have IDs
                if (storeName === 'creatures' && Array.isArray(item.abilities)) {
                  item.abilities.forEach((ability: any) => {
                    if (!ability.id) {
                      ability.id = generateId();
                    }
                  });
                }

                stores[storeName].put(item);
                if ('tags' in item) {
                    processTags(item.tags, storeName as TagSource);
                }
            });
        }
    };

    storeNamesToImport.forEach(storeName => {
        processStore(storeName, data[storeName]);
    });
    
    allTagsToCreate.forEach(tag => {
        stores.tags.put(tag);
    });
    
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};
