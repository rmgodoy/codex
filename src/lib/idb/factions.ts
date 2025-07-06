
"use client";

import type { Faction, NewFaction } from '@/lib/types';
import { getDb, generateId, FACTIONS_STORE_NAME } from './db';

// Faction Functions
export const getAllFactions = async (): Promise<Faction[]> => {
    const db = await getDb();
    const store = db.transaction(FACTIONS_STORE_NAME, 'readonly').objectStore(FACTIONS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getFactionById = async (id: string): Promise<Faction | undefined> => {
    const db = await getDb();
    const store = db.transaction(FACTIONS_STORE_NAME, 'readonly').objectStore(FACTIONS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addFaction = async (factionData: NewFaction): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(FACTIONS_STORE_NAME, 'readwrite').objectStore(FACTIONS_STORE_NAME);
    const id = generateId();
    const factionWithId = { ...factionData, id };
    const request = store.add(factionWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateFaction = async (faction: Faction): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(FACTIONS_STORE_NAME, 'readwrite').objectStore(FACTIONS_STORE_NAME);
    const request = store.put(faction);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteFaction = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(FACTIONS_STORE_NAME, 'readwrite').objectStore(FACTIONS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
