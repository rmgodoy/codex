
"use client";

import type { Calendar, NewCalendar } from '@/lib/types';
import { getDb, generateId, CALENDARS_STORE_NAME, CALENDAR_EVENTS_STORE_NAME } from './db';

export const getAllCalendars = async (): Promise<Calendar[]> => {
    const db = await getDb();
    const store = db.transaction(CALENDARS_STORE_NAME, 'readonly').objectStore(CALENDARS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            // Sort by name alphabetically
            const sorted = request.result.sort((a, b) => a.name.localeCompare(b.name));
            resolve(sorted);
        };
        request.onerror = () => reject(request.error);
    });
};

export const addCalendar = async (calendarData: NewCalendar): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(CALENDARS_STORE_NAME, 'readwrite').objectStore(CALENDARS_STORE_NAME);
    const id = generateId();
    const calendarWithId = { ...calendarData, id };
    const request = store.add(calendarWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateCalendar = async (calendar: Calendar): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CALENDARS_STORE_NAME, 'readwrite').objectStore(CALENDARS_STORE_NAME);
    const request = store.put(calendar);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteCalendarAndEvents = async (calendarId: string): Promise<void> => {
    const db = await getDb();
    const tx = db.transaction([CALENDARS_STORE_NAME, CALENDAR_EVENTS_STORE_NAME], 'readwrite');
    const calendarsStore = tx.objectStore(CALENDARS_STORE_NAME);
    const eventsStore = tx.objectStore(CALENDAR_EVENTS_STORE_NAME);
    const eventsIndex = eventsStore.index('by_calendar');

    return new Promise<void>((resolve, reject) => {
        calendarsStore.delete(calendarId).onerror = reject;

        const eventsRequest = eventsIndex.openKeyCursor(IDBKeyRange.only(calendarId));
        eventsRequest.onsuccess = () => {
            const cursor = eventsRequest.result;
            if (cursor) {
                eventsStore.delete(cursor.primaryKey);
                cursor.continue();
            }
        };
        eventsRequest.onerror = reject;

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};
