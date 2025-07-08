
"use client";

import type { Map, NewMap } from '@/lib/types';
import { getDb, generateId, MAPS_STORE_NAME } from './db';

// Map Functions
export const getAllMaps = async (): Promise<Map[]> => {
    const db = await getDb();
    const store = db.transaction(MAPS_STORE_NAME, 'readonly').objectStore(MAPS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getMapById = async (id: string): Promise<Map | undefined> => {
    const db = await getDb();
    const store = db.transaction(MAPS_STORE_NAME, 'readonly').objectStore(MAPS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addMap = async (mapData: NewMap): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(MAPS_STORE_NAME, 'readwrite').objectStore(MAPS_STORE_NAME);
    const id = generateId();
    const mapWithId = { ...mapData, id };
    const request = store.add(mapWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateMap = async (map: Map): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(MAPS_STORE_NAME, 'readwrite').objectStore(MAPS_STORE_NAME);
    const request = store.put(map);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteMap = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(MAPS_STORE_NAME, 'readwrite').objectStore(MAPS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
