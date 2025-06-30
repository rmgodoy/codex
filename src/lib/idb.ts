
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

export const exportAllData = async (): Promise<{ creatures: Creature[], deeds: Deed[] }> => {
    const db = await getDb();
    const transaction = db.transaction([CREATURES_STORE_NAME, DEEDS_STORE_NAME], 'readonly');
    const creatureStore = transaction.objectStore(CREATURES_STORE_NAME);
    const deedStore = transaction.objectStore(DEEDS_STORE_NAME);

    const creaturesPromise = new Promise<Creature[]>((resolve, reject) => {
        const req = creatureStore.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    const deedsPromise = new Promise<Deed[]>((resolve, reject) => {
        const req = deedStore.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    const [creatures, deeds] = await Promise.all([creaturesPromise, deedsPromise]);
    return { creatures, deeds };
};

export const importCreatures = async (data: any): Promise<void> => {
    const db = await getDb();

    if (typeof data !== 'object' || data === null || (!Array.isArray(data.creatures) && !Array.isArray(data.deeds))) {
        return Promise.reject(new Error("Invalid import file format. Expected an object with 'creatures' and/or 'deeds' arrays."));
    }

    const tx = db.transaction([CREATURES_STORE_NAME, DEEDS_STORE_NAME], 'readwrite');
    const creatureStore = tx.objectStore(CREATURES_STORE_NAME);
    const deedStore = tx.objectStore(DEEDS_STORE_NAME);

    creatureStore.clear();
    deedStore.clear();

    if (data.creatures && Array.isArray(data.creatures)) {
        data.creatures.forEach(creature => {
            creatureStore.put(creature);
        });
    }

    if (data.deeds && Array.isArray(data.deeds)) {
        data.deeds.forEach(deed => {
            deedStore.put(deed);
        });
    }
    
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
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
