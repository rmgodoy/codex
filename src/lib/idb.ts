
"use client";

import type { Creature } from '@/lib/types';

const DB_NAME = 'TresspasserBestiaryDB';
const DB_VERSION = 1;
const STORE_NAME = 'creatures';

const getDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject('IndexedDB can only be used in a browser environment.');
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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

const getStore = async (mode: IDBTransactionMode): Promise<IDBObjectStore> => {
  const db = await getDb();
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
};

export const getAllCreatures = async (): Promise<Creature[]> => {
    const store = await getStore('readonly');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getCreatureById = async (id: string): Promise<Creature | undefined> => {
    const store = await getStore('readonly');
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const generateId = () => crypto.randomUUID();

export const addCreature = async (creatureData: Omit<Creature, 'id'>): Promise<string> => {
    const store = await getStore('readwrite');
    const id = generateId();
    const creatureWithId = { ...creatureData, id };
    const request = store.add(creatureWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateCreature = async (creature: Creature): Promise<void> => {
    const store = await getStore('readwrite');
    const request = store.put(creature);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteCreature = async (id: string): Promise<void> => {
    const store = await getStore('readwrite');
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const importCreatures = async (creatures: Partial<Creature>[]): Promise<void> => {
    const db = await getDb();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const clearRequest = store.clear();

    return new Promise<void>((resolve, reject) => {
        clearRequest.onsuccess = () => {
            creatures.forEach(creature => {
                const creatureWithId = {
                    ...creature,
                    id: creature.id || generateId(),
                };
                store.put(creatureWithId);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        };
        clearRequest.onerror = () => {
            reject(clearRequest.error);
        };
    });
};
