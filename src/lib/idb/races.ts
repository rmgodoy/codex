
"use client";

import type { Race, NewRace } from '@/lib/types';
import { getDb, generateId, RACES_STORE_NAME } from './db';

export const getAllRaces = async (): Promise<Race[]> => {
    const db = await getDb();
    const store = db.transaction(RACES_STORE_NAME, 'readonly').objectStore(RACES_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getRaceById = async (id: string): Promise<Race | undefined> => {
    const db = await getDb();
    const store = db.transaction(RACES_STORE_NAME, 'readonly').objectStore(RACES_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addRace = async (raceData: NewRace): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(RACES_STORE_NAME, 'readwrite').objectStore(RACES_STORE_NAME);
    const id = generateId();
    const raceWithId = { ...raceData, id };
    const request = store.add(raceWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateRace = async (race: Race): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(RACES_STORE_NAME, 'readwrite').objectStore(RACES_STORE_NAME);
    const request = store.put(race);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteRace = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(RACES_STORE_NAME, 'readwrite').objectStore(RACES_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
