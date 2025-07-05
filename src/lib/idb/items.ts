
"use client";

import type { Item, NewItem } from '@/lib/types';
import { getDb, generateId, ITEMS_STORE_NAME } from './db';


// Item Functions
export const getAllItems = async (): Promise<Item[]> => {
    const db = await getDb();
    const store = db.transaction(ITEMS_STORE_NAME, 'readonly').objectStore(ITEMS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getItemById = async (id: string): Promise<Item | undefined> => {
    const db = await getDb();
    const store = db.transaction(ITEMS_STORE_NAME, 'readonly').objectStore(ITEMS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addItem = async (itemData: NewItem): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(ITEMS_STORE_NAME, 'readwrite').objectStore(ITEMS_STORE_NAME);
    const id = generateId();
    const itemWithId = { ...itemData, id };
    const request = store.add(itemWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateItem = async (item: Item): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ITEMS_STORE_NAME, 'readwrite').objectStore(ITEMS_STORE_NAME);
    const request = store.put(item);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteItem = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ITEMS_STORE_NAME, 'readwrite').objectStore(ITEMS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
