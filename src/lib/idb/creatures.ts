
"use client";

import type { Creature, NewCreature } from '@/lib/types';
import { getDb, generateId, CREATURES_STORE_NAME } from './db';

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

export const getCreaturesByIds = async (ids: string[]): Promise<Creature[]> => {
    if (!ids || ids.length === 0) return [];
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readonly').objectStore(CREATURES_STORE_NAME);
    
    const results: Creature[] = [];
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


export const addCreature = async (creatureData: NewCreature): Promise<string> => {
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
