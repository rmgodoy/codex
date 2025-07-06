
"use client";

import type { CalendarEvent, NewCalendarEvent } from '@/lib/types';
import { getDb, generateId, CALENDAR_EVENTS_STORE_NAME } from './db';

export const getAllCalendarEvents = async (calendarId?: string | null): Promise<CalendarEvent[]> => {
    const db = await getDb();
    const store = db.transaction(CALENDAR_EVENTS_STORE_NAME, 'readonly').objectStore(CALENDAR_EVENTS_STORE_NAME);

    if (!calendarId || calendarId === 'all') {
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    const index = store.index('by_calendar');
    const request = index.getAll(IDBKeyRange.only(calendarId));
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getCalendarEventById = async (id: string): Promise<CalendarEvent | undefined> => {
    const db = await getDb();
    const store = db.transaction(CALENDAR_EVENTS_STORE_NAME, 'readonly').objectStore(CALENDAR_EVENTS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addCalendarEvent = async (eventData: NewCalendarEvent): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(CALENDAR_EVENTS_STORE_NAME, 'readwrite').objectStore(CALENDAR_EVENTS_STORE_NAME);
    const id = generateId();
    const eventWithId = { ...eventData, id };
    const request = store.add(eventWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateCalendarEvent = async (event: CalendarEvent): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CALENDAR_EVENTS_STORE_NAME, 'readwrite').objectStore(CALENDAR_EVENTS_STORE_NAME);
    const request = store.put(event);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteCalendarEvent = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CALENDAR_EVENTS_STORE_NAME, 'readwrite').objectStore(CALENDAR_EVENTS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
