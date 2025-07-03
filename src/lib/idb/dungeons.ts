
"use client";

import type { Dungeon, NewDungeon } from '@/lib/types';
import { getDb, generateId, DUNGEONS_STORE_NAME } from './db';

// Dungeon Functions
export const getAllDungeons = async (): Promise<Dungeon[]> => {
    const db = await getDb();
    const store = db.transaction(DUNGEONS_STORE_NAME, 'readonly').objectStore(DUNGEONS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getDungeonById = async (id: string): Promise<Dungeon | undefined> => {
    const db = await getDb();
    const store = db.transaction(DUNGEONS_STORE_NAME, 'readonly').objectStore(DUNGEONS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addDungeon = async (dungeonData: NewDungeon): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(DUNGEONS_STORE_NAME, 'readwrite').objectStore(DUNGEONS_STORE_NAME);
    const id = generateId();
    const dungeonWithId = { ...dungeonData, id };
    const request = store.add(dungeonWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateDungeon = async (dungeon: Dungeon): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(DUNGEONS_STORE_NAME, 'readwrite').objectStore(DUNGEONS_STORE_NAME);
    const request = store.put(dungeon);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteDungeon = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(DUNGEONS_STORE_NAME, 'readwrite').objectStore(DUNGEONS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
