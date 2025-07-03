
"use client";

import { Hex, Grid, define, hexagon } from 'honeycomb-grid';
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

export const addMap = async (mapData: Pick<MapData, 'name' | 'description'> & { size: number }): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(MAPS_STORE_NAME, 'readwrite').objectStore(MAPS_STORE_NAME);
    
    const HexTile = define({ dimensions: 50, orientation: 'pointy' });
    const grid = new Grid(HexTile, hexagon({ radius: mapData.size }));

    const tiles = grid.map(hex => ({
        id: hex.toString(),
        q: hex.q,
        r: hex.r,
        s: hex.s,
        color: '#cccccc',
    }));
    
    const newMap: NewMapData = { 
        name: mapData.name,
        description: mapData.description || '',
        width: (mapData.size * 2 + 1),
        height: (mapData.size * 2 + 1),
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
