
"use client";

export const DB_NAME = 'TresspasserBestiaryDB';
export const DB_VERSION = 17;
export const CREATURES_STORE_NAME = 'creatures';
export const DEEDS_STORE_NAME = 'deeds';
export const ENCOUNTERS_STORE_NAME = 'encounters';
export const TAGS_STORE_NAME = 'tags';
export const ENCOUNTER_TABLES_STORE_NAME = 'encounterTables';
export const TREASURES_STORE_NAME = 'treasures';
export const ALCHEMY_ITEMS_STORE_NAME = 'alchemicalItems';
export const ROOMS_STORE_NAME = 'rooms';
export const DUNGEONS_STORE_NAME = 'dungeons';
export const ITEMS_STORE_NAME = 'items';
export const FACTIONS_STORE_NAME = 'factions';
export const NPCS_STORE_NAME = 'npcs';
export const CALENDAR_EVENTS_STORE_NAME = 'calendarEvents';
export const CALENDARS_STORE_NAME = 'calendars';
export const MAPS_STORE_NAME = 'maps';

export const getDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject('IndexedDB can only be used in a browser environment.');
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      if (!db.objectStoreNames.contains(CREATURES_STORE_NAME)) {
        db.createObjectStore(CREATURES_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DEEDS_STORE_NAME)) {
        db.createObjectStore(DEEDS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ENCOUNTERS_STORE_NAME)) {
        db.createObjectStore(ENCOUNTERS_STORE_NAME, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(TAGS_STORE_NAME)) {
          const tagsStore = db.createObjectStore(TAGS_STORE_NAME, { keyPath: ['name', 'source'] });
          tagsStore.createIndex('by_source', 'source', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(ENCOUNTER_TABLES_STORE_NAME)) {
        db.createObjectStore(ENCOUNTER_TABLES_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(TREASURES_STORE_NAME)) {
        db.createObjectStore(TREASURES_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ALCHEMY_ITEMS_STORE_NAME)) {
        db.createObjectStore(ALCHEMY_ITEMS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ROOMS_STORE_NAME)) {
        db.createObjectStore(ROOMS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DUNGEONS_STORE_NAME)) {
        db.createObjectStore(DUNGEONS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ITEMS_STORE_NAME)) {
        db.createObjectStore(ITEMS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FACTIONS_STORE_NAME)) {
        db.createObjectStore(FACTIONS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(NPCS_STORE_NAME)) {
        db.createObjectStore(NPCS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CALENDARS_STORE_NAME)) {
        db.createObjectStore(CALENDARS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CALENDAR_EVENTS_STORE_NAME)) {
        const eventsStore = db.createObjectStore(CALENDAR_EVENTS_STORE_NAME, { keyPath: 'id' });
        eventsStore.createIndex('by_calendar', 'calendarId', { unique: false });
      } else if (oldVersion < 16) {
        const eventsStore = request.transaction!.objectStore(CALENDAR_EVENTS_STORE_NAME);
        if (!eventsStore.indexNames.contains('by_calendar')) {
          eventsStore.createIndex('by_calendar', 'calendarId', { unique: false });
        }
      }
      if (!db.objectStoreNames.contains(MAPS_STORE_NAME)) {
          db.createObjectStore(MAPS_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
  });
};

export const generateId = () => crypto.randomUUID();
