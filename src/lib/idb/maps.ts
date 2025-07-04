
"use client";

import type { MapData, NewMapData } from '@/lib/types';
import { getDb, generateId, MAPS_STORE_NAME } from './db';

export const getAllMaps = async (): Promise<MapData[]> => {
    const db = await getDb();
    const store = db.transaction(MAPS_STORE_NAME, 'readonly').objectStore(MAPS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getMapById = async (id: string): Promise<MapData | undefined> => {
    const db = await getDb();
    const store = db.transaction(MAPS_STORE_NAME, 'readonly').objectStore(MAPS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addMap = async (mapData: Pick<MapData, 'name' | 'description' | 'radius'>): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(MAPS_STORE_NAME, 'readwrite').objectStore(MAPS_STORE_NAME);
    
    const tiles = [];
    const radius = mapData.radius;
    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
            const s = -q - r;
            tiles.push({
                id: `${q},${r},${s}`,
                q,
                r,
                s,
                color: '#cccccc',
            });
        }
    }
    
    const newMap: NewMapData = { 
        name: mapData.name,
        description: mapData.description || '',
        radius: mapData.radius,
        tags: [], 
        tiles 
    };
    
    const id = generateId();
    const mapWithId = { ...newMap, id };

    const request = store.add(mapWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateMap = async (mapData: MapData): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(MAPS_STORE_NAME, 'readwrite').objectStore(MAPS_STORE_NAME);
    const request = store.put(mapData);
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
