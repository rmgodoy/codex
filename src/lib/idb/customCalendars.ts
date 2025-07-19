
"use client";

import type { CustomCalendar, NewCustomCalendar, Calendar } from '@/lib/types';
import { getDb, generateId, CUSTOM_CALENDARS_STORE_NAME, CALENDARS_STORE_NAME, CALENDAR_EVENTS_STORE_NAME } from './db';

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

export const deleteCustomCalendarAndRelatedCalendars = async (modelId: string): Promise<void> => {
    const db = await getDb();
    const tx = db.transaction([CUSTOM_CALENDARS_STORE_NAME, CALENDARS_STORE_NAME, CALENDAR_EVENTS_STORE_NAME], 'readwrite');
    const customCalendarsStore = tx.objectStore(CUSTOM_CALENDARS_STORE_NAME);
    const calendarsStore = tx.objectStore(CALENDARS_STORE_NAME);
    const eventsStore = tx.objectStore(CALENDAR_EVENTS_STORE_NAME);
    const eventsIndex = eventsStore.index('by_calendar');

    return new Promise<void>((resolve, reject) => {
        // 1. Delete the custom calendar model itself
        customCalendarsStore.delete(modelId).onerror = reject;

        // 2. Find all calendars using this model
        const calendarsRequest = calendarsStore.getAll();
        calendarsRequest.onsuccess = () => {
            const allCalendars: Calendar[] = calendarsRequest.result;
            const calendarsToDelete = allCalendars.filter(cal => cal.modelId === modelId);
            const calendarIdsToDelete = calendarsToDelete.map(cal => cal.id);

            if (calendarIdsToDelete.length === 0) {
                // No related calendars, we are done with this part
                return;
            }

            // 3. Delete the related calendars
            calendarIdsToDelete.forEach(calId => {
                calendarsStore.delete(calId).onerror = reject;
            });

            // 4. Delete all events associated with those calendars
            const eventsRequest = eventsIndex.openKeyCursor();
            eventsRequest.onsuccess = () => {
                const cursor = eventsRequest.result;
                if (cursor) {
                    if (calendarIdsToDelete.includes(cursor.key as string)) {
                        eventsStore.delete(cursor.primaryKey).onerror = reject;
                    }
                    cursor.continue();
                }
            };
            eventsRequest.onerror = reject;
        };
        calendarsRequest.onerror = reject;

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};


export const deleteCustomCalendar = async (id: string): Promise<void> => {
    return deleteCustomCalendarAndRelatedCalendars(id);
};
