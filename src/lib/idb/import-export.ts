
"use client";

import { getDb, ALL_STORE_NAMES, setWorldDbName, generateId } from './db';
import type { TagSource } from '@/lib/types';


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

export const importData = async (data: any): Promise<void> => {
    const db = await getDb();

    if (typeof data !== 'object' || data === null) {
        return Promise.reject(new Error("Invalid import file format. Expected an object with arrays of data."));
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
                // Ensure item has an ID before putting it in the store
                if (!item.id) {
                    item.id = generateId();
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
