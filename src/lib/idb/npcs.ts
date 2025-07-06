
"use client";

import type { Npc, NewNpc } from '@/lib/types';
import { getDb, generateId, NPCS_STORE_NAME } from './db';

// NPC Functions
export const getAllNpcs = async (): Promise<Npc[]> => {
    const db = await getDb();
    const store = db.transaction(NPCS_STORE_NAME, 'readonly').objectStore(NPCS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getNpcById = async (id: string): Promise<Npc | undefined> => {
    const db = await getDb();
    const store = db.transaction(NPCS_STORE_NAME, 'readonly').objectStore(NPCS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addNpc = async (npcData: NewNpc): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(NPCS_STORE_NAME, 'readwrite').objectStore(NPCS_STORE_NAME);
    const id = generateId();
    const npcWithId = { ...npcData, id };
    const request = store.add(npcWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateNpc = async (npc: Npc): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(NPCS_STORE_NAME, 'readwrite').objectStore(NPCS_STORE_NAME);
    const request = store.put(npc);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteNpc = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(NPCS_STORE_NAME, 'readwrite').objectStore(NPCS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
