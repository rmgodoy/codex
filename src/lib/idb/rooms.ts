
"use client";

import type { Room, NewRoom } from '@/lib/types';
import { getDb, generateId, ROOMS_STORE_NAME } from './db';

// Room Functions
export const getAllRooms = async (): Promise<Room[]> => {
    const db = await getDb();
    const store = db.transaction(ROOMS_STORE_NAME, 'readonly').objectStore(ROOMS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getRoomById = async (id: string): Promise<Room | undefined> => {
    const db = await getDb();
    const store = db.transaction(ROOMS_STORE_NAME, 'readonly').objectStore(ROOMS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addRoom = async (roomData: NewRoom): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(ROOMS_STORE_NAME, 'readwrite').objectStore(ROOMS_STORE_NAME);
    const id = generateId();
    const roomWithId = { ...roomData, id };
    const request = store.add(roomWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateRoom = async (room: Room): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ROOMS_STORE_NAME, 'readwrite').objectStore(ROOMS_STORE_NAME);
    const request = store.put(room);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteRoom = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ROOMS_STORE_NAME, 'readwrite').objectStore(ROOMS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
