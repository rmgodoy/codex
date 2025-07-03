
"use client";

import type { AlchemicalItem, NewAlchemicalItem } from '@/lib/types';
import { getDb, generateId, ALCHEMY_ITEMS_STORE_NAME } from './db';


// Alchemical Item Functions
export const getAllAlchemicalItems = async (): Promise<AlchemicalItem[]> => {
    const db = await getDb();
    const store = db.transaction(ALCHEMY_ITEMS_STORE_NAME, 'readonly').objectStore(ALCHEMY_ITEMS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getAlchemicalItemById = async (id: string): Promise<AlchemicalItem | undefined> => {
    const db = await getDb();
    const store = db.transaction(ALCHEMY_ITEMS_STORE_NAME, 'readonly').objectStore(ALCHEMY_ITEMS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addAlchemicalItem = async (itemData: NewAlchemicalItem): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(ALCHEMY_ITEMS_STORE_NAME, 'readwrite').objectStore(ALCHEMY_ITEMS_STORE_NAME);
    const id = generateId();
    const itemWithId = { ...itemData, id };
    const request = store.add(itemWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateAlchemicalItem = async (item: AlchemicalItem): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ALCHEMY_ITEMS_STORE_NAME, 'readwrite').objectStore(ALCHEMY_ITEMS_STORE_NAME);
    const request = store.put(item);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteAlchemicalItem = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ALCHEMY_ITEMS_STORE_NAME, 'readwrite').objectStore(ALCHEMY_ITEMS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
