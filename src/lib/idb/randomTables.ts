
"use client";

import type { RandomTable, NewRandomTable } from '@/lib/types';
import { getDb, generateId, RANDOM_TABLES_STORE_NAME } from './db';

// Random Table Functions
export const getAllRandomTables = async (): Promise<RandomTable[]> => {
    const db = await getDb();
    const store = db.transaction(RANDOM_TABLES_STORE_NAME, 'readonly').objectStore(RANDOM_TABLES_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getRandomTableById = async (id: string): Promise<RandomTable | undefined> => {
    const db = await getDb();
    const store = db.transaction(RANDOM_TABLES_STORE_NAME, 'readonly').objectStore(RANDOM_TABLES_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addRandomTable = async (tableData: NewRandomTable): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(RANDOM_TABLES_STORE_NAME, 'readwrite').objectStore(RANDOM_TABLES_STORE_NAME);
    const id = generateId();
    const tableWithId = { ...tableData, id };
    const request = store.add(tableWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateRandomTable = async (table: RandomTable): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(RANDOM_TABLES_STORE_NAME, 'readwrite').objectStore(RANDOM_TABLES_STORE_NAME);
    const request = store.put(table);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteRandomTable = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(RANDOM_TABLES_STORE_NAME, 'readwrite').objectStore(RANDOM_TABLES_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
