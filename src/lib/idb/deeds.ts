
"use client";

import type { Deed, DeedData } from '@/lib/types';
import { getDb, generateId, DEEDS_STORE_NAME } from './db';

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

export const getDeedById = async (id: string): Promise<Deed | undefined> => {
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readonly').objectStore(DEEDS_STORE_NAME);
    const request = store.get(id);
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

export const updateDeed = async (deed: Deed): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readwrite').objectStore(DEEDS_STORE_NAME);
    const request = store.put(deed);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteDeed = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readwrite').objectStore(DEEDS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
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
