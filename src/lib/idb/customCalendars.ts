
"use client";

import type { CustomCalendar, NewCustomCalendar } from '@/lib/types';
import { getDb, generateId, CUSTOM_CALENDARS_STORE_NAME } from './db';

// Custom Calendar Functions
export const getAllCustomCalendars = async (): Promise<CustomCalendar[]> => {
    const db = await getDb();
    const store = db.transaction(CUSTOM_CALENDARS_STORE_NAME, 'readonly').objectStore(CUSTOM_CALENDARS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getCustomCalendarById = async (id: string): Promise<CustomCalendar | undefined> => {
    const db = await getDb();
    const store = db.transaction(CUSTOM_CALENDARS_STORE_NAME, 'readonly').objectStore(CUSTOM_CALENDARS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addCustomCalendar = async (calendarData: NewCustomCalendar): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(CUSTOM_CALENDARS_STORE_NAME, 'readwrite').objectStore(CUSTOM_CALENDARS_STORE_NAME);
    const id = generateId();
    const calendarWithId = { ...calendarData, id };
    const request = store.add(calendarWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateCustomCalendar = async (calendar: CustomCalendar): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CUSTOM_CALENDARS_STORE_NAME, 'readwrite').objectStore(CUSTOM_CALENDARS_STORE_NAME);
    const request = store.put(calendar);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteCustomCalendar = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CUSTOM_CALENDARS_STORE_NAME, 'readwrite').objectStore(CUSTOM_CALENDARS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
