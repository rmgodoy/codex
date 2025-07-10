
"use client";

import type { PantheonEntity, NewPantheonEntity } from '@/lib/types';
import { getDb, generateId, PANTHEON_STORE_NAME } from './db';

// Pantheon Entity Functions
export const getAllPantheonEntities = async (): Promise<PantheonEntity[]> => {
    const db = await getDb();
    const store = db.transaction(PANTHEON_STORE_NAME, 'readonly').objectStore(PANTHEON_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getPantheonEntityById = async (id: string): Promise<PantheonEntity | undefined> => {
    const db = await getDb();
    const store = db.transaction(PANTHEON_STORE_NAME, 'readonly').objectStore(PANTHEON_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addPantheonEntity = async (entityData: NewPantheonEntity): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(PANTHEON_STORE_NAME, 'readwrite').objectStore(PANTHEON_STORE_NAME);
    const id = generateId();
    const entityWithId = { ...entityData, id };
    const request = store.add(entityWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updatePantheonEntity = async (entity: PantheonEntity): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(PANTHEON_STORE_NAME, 'readwrite').objectStore(PANTHEON_STORE_NAME);
    const request = store.put(entity);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deletePantheonEntity = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(PANTHEON_STORE_NAME, 'readwrite').objectStore(PANTHEON_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
