
"use client";

import type { EncounterTable } from '@/lib/types';
import { getDb, generateId, ENCOUNTER_TABLES_STORE_NAME } from './db';

// Encounter Table Functions
export const getAllEncounterTables = async (): Promise<EncounterTable[]> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTER_TABLES_STORE_NAME, 'readonly').objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getEncounterTableById = async (id: string): Promise<EncounterTable | undefined> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTER_TABLES_STORE_NAME, 'readonly').objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addEncounterTable = async (tableData: Omit<EncounterTable, 'id'>): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTER_TABLES_STORE_NAME, 'readwrite').objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const id = generateId();
    const tableWithId = { ...tableData, id };
    const request = store.add(tableWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateEncounterTable = async (table: EncounterTable): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTER_TABLES_STORE_NAME, 'readwrite').objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const request = store.put(table);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteEncounterTable = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTER_TABLES_STORE_NAME, 'readwrite').objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
