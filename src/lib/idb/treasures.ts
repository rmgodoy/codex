
"use client";

import type { Treasure, NewTreasure } from '@/lib/types';
import { getDb, generateId, TREASURES_STORE_NAME } from './db';

// Treasure Functions
export const getAllTreasures = async (): Promise<Treasure[]> => {
    const db = await getDb();
    const store = db.transaction(TREASURES_STORE_NAME, 'readonly').objectStore(TREASURES_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getTreasureById = async (id: string): Promise<Treasure | undefined> => {
    const db = await getDb();
    const store = db.transaction(TREASURES_STORE_NAME, 'readonly').objectStore(TREASURES_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addTreasure = async (treasureData: NewTreasure): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(TREASURES_STORE_NAME, 'readwrite').objectStore(TREASURES_STORE_NAME);
    const id = generateId();
    const treasureWithId = { ...treasureData, id };
    const request = store.add(treasureWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateTreasure = async (treasure: Treasure): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(TREASURES_STORE_NAME, 'readwrite').objectStore(TREASURES_STORE_NAME);
    const request = store.put(treasure);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteTreasure = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(TREASURES_STORE_NAME, 'readwrite').objectStore(TREASURES_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
