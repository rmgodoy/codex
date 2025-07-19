
"use client";

import type { City, NewCity } from '@/lib/types';
import { getDb, generateId, CITIES_STORE_NAME } from './db';

// City Functions
export const getAllCities = async (): Promise<City[]> => {
    const db = await getDb();
    const store = db.transaction(CITIES_STORE_NAME, 'readonly').objectStore(CITIES_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getCityById = async (id: string): Promise<City | undefined> => {
    const db = await getDb();
    const store = db.transaction(CITIES_STORE_NAME, 'readonly').objectStore(CITIES_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addCity = async (cityData: NewCity): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(CITIES_STORE_NAME, 'readwrite').objectStore(CITIES_STORE_NAME);
    const id = generateId();
    const cityWithId = { ...cityData, id };
    const request = store.add(cityWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateCity = async (city: City): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CITIES_STORE_NAME, 'readwrite').objectStore(CITIES_STORE_NAME);
    const request = store.put(city);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteCity = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CITIES_STORE_NAME, 'readwrite').objectStore(CITIES_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
