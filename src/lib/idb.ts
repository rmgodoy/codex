
"use client";

import type { Creature, Deed, DeedData } from '@/lib/types';

const DB_NAME = 'TresspasserBestiaryDB';
const DB_VERSION = 2;
const CREATURES_STORE_NAME = 'creatures';
const DEEDS_STORE_NAME = 'deeds';

const getDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject('IndexedDB can only be used in a browser environment.');
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CREATURES_STORE_NAME)) {
        db.createObjectStore(CREATURES_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DEEDS_STORE_NAME)) {
        db.createObjectStore(DEEDS_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
  });
};

const generateId = () => crypto.randomUUID();

// Creature Functions
export const getAllCreatures = async (): Promise<Creature[]> => {
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readonly').objectStore(CREATURES_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getCreatureById = async (id: string): Promise<Creature | undefined> => {
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readonly').objectStore(CREATURES_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addCreature = async (creatureData: Omit<Creature, 'id'>): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readwrite').objectStore(CREATURES_STORE_NAME);
    const id = generateId();
    const creatureWithId = { ...creatureData, id };
    const request = store.add(creatureWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateCreature = async (creature: Creature): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readwrite').objectStore(CREATURES_STORE_NAME);
    const request = store.put(creature);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteCreature = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readwrite').objectStore(CREATURES_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const importCreatures = async (importedData: any[]): Promise<void> => {
    const db = await getDb();
    const transaction = db.transaction([CREATURES_STORE_NAME, DEEDS_STORE_NAME], 'readwrite');
    const creatureStore = transaction.objectStore(CREATURES_STORE_NAME);
    const deedStore = transaction.objectStore(DEEDS_STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
        const req = creatureStore.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });

    const deedsToCreate: Deed[] = [];

    const creaturesToImport = importedData.map(c => {
        const creatureWithId = { ...c, id: c.id || generateId() };
        
        if (creatureWithId.deeds && creatureWithId.deeds.length > 0 && typeof creatureWithId.deeds[0] === 'object') {
            const deedIds = creatureWithId.deeds.map((deedObj: any) => {
                const newDeedId = deedObj.id || generateId();
                const newDeed: Deed = { ...deedObj, id: newDeedId };
                deedsToCreate.push(newDeed);
                return newDeedId;
            });
            return { ...creatureWithId, deeds: deedIds };
        }
        return creatureWithId;
    });

    return new Promise<void>((resolve, reject) => {
        let creatureCount = 0;
        let deedCount = 0;

        creaturesToImport.forEach(creature => {
            creatureStore.put(creature).onsuccess = () => {
                creatureCount++;
                if (creatureCount === creaturesToImport.length && deedCount === deedsToCreate.length) {
                    resolve();
                }
            };
        });

        if (deedsToCreate.length === 0 && creaturesToImport.length === 0) {
            resolve();
            return;
        }

        deedsToCreate.forEach(deed => {
            deedStore.put(deed).onsuccess = () => {
                deedCount++;
                if (creatureCount === creaturesToImport.length && deedCount === deedsToCreate.length) {
                    resolve();
                }
            };
        });

        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
    });
};


// Deed Functions
export const getAllDeeds = async (): Promise<Deed[]> => {
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readonly').objectStore(DEEDS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addDeed = async (deedData: DeedData): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readwrite').objectStore(DEEDS_STORE_NAME);
    const id = generateId();
    const deedWithId = { ...deedData, id };
    const request = store.add(deedWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const getDeedsByIds = async (ids: string[]): Promise<Deed[]> => {
    if (!ids || ids.length === 0) return [];
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readonly').objectStore(DEEDS_STORE_NAME);
    
    const results: Deed[] = [];
    const promises = ids.map(id => {
        return new Promise<void>((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                if (request.result) {
                    results.push(request.result);
                }
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    });

    await Promise.all(promises);
    return results;
};
