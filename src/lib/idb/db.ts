
"use client";

import type { WorldMetadata } from "../types";

export const DB_PREFIX = "TresspasserDB_";
export let DB_NAME = `${DB_PREFIX}Default`;
export const DB_VERSION = 6; // Incremented version to ensure onupgradeneeded runs

// Metadata DB for tracking all worlds
const METADATA_DB_NAME = "TresspasserWorldsMetadata";
const METADATA_DB_VERSION = 1;

export const WORLDS_METADATA_STORE_NAME = "worlds";

// Store names for a single world DB
export const CREATURES_STORE_NAME = "creatures";
export const DEEDS_STORE_NAME = "deeds";
export const ENCOUNTERS_STORE_NAME = "encounters";
export const TAGS_STORE_NAME = "tags";
export const ENCOUNTER_TABLES_STORE_NAME = "encounterTables";
export const TREASURES_STORE_NAME = "treasures";
export const ALCHEMY_ITEMS_STORE_NAME = "alchemicalItems";
export const ROOMS_STORE_NAME = "rooms";
export const DUNGEONS_STORE_NAME = "dungeons";
export const ITEMS_STORE_NAME = "items";
export const FACTIONS_STORE_NAME = "factions";
export const NPCS_STORE_NAME = "npcs";
export const PANTHEON_STORE_NAME = "pantheon";
export const CALENDAR_EVENTS_STORE_NAME = "calendarEvents";
export const CALENDARS_STORE_NAME = "calendars";
export const MAPS_STORE_NAME = "maps";
export const CUSTOM_CALENDARS_STORE_NAME = "customCalendars";
export const CITIES_STORE_NAME = "cities";
export const RACES_STORE_NAME = "races";

export const ALL_STORE_NAMES = [
  CREATURES_STORE_NAME,
  DEEDS_STORE_NAME,
  ENCOUNTERS_STORE_NAME,
  TAGS_STORE_NAME,
  ENCOUNTER_TABLES_STORE_NAME,
  TREASURES_STORE_NAME,
  ALCHEMY_ITEMS_STORE_NAME,
  ROOMS_STORE_NAME,
  DUNGEONS_STORE_NAME,
  ITEMS_STORE_NAME,
  FACTIONS_STORE_NAME,
  NPCS_STORE_NAME,
  PANTHEON_STORE_NAME,
  CALENDARS_STORE_NAME,
  CALENDAR_EVENTS_STORE_NAME,
  MAPS_STORE_NAME,
  CUSTOM_CALENDARS_STORE_NAME,
  CITIES_STORE_NAME,
  RACES_STORE_NAME,
];

let db: IDBDatabase | null = null;
let metadataDb: IDBDatabase | null = null;

const getMetadataDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (metadataDb) {
      return resolve(metadataDb);
    }
    if (typeof window === "undefined") {
      return reject("IndexedDB can only be used in a browser environment.");
    }

    const request = indexedDB.open(METADATA_DB_NAME, METADATA_DB_VERSION);

    request.onupgradeneeded = () => {
      const currentDb = request.result;
      if (!currentDb.objectStoreNames.contains(WORLDS_METADATA_STORE_NAME)) {
        currentDb.createObjectStore(WORLDS_METADATA_STORE_NAME, {
          keyPath: "slug",
        });
      }
    };

    request.onsuccess = () => {
      metadataDb = request.result;
      resolve(metadataDb);
    };

    request.onerror = () => {
      console.error("Metadata DB error:", request.error);
      reject(request.error);
    };
  });
};

export const setWorldDbName = (worldSlug: string) => {
  if (!worldSlug) {
    DB_NAME = "";
  } else {
    DB_NAME = `${DB_PREFIX}${worldSlug}`;
  }

  if (db) {
    db.close();
    db = null;
  }
};

export const listWorlds = async (): Promise<WorldMetadata[]> => {
  if (!window.indexedDB) return [];
  try {
    const metaDb = await getMetadataDb();
    const store = metaDb
      .transaction(WORLDS_METADATA_STORE_NAME, "readonly")
      .objectStore(WORLDS_METADATA_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const worlds = request.result as WorldMetadata[];
        resolve(worlds);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to list worlds:", e);
    return [];
  }
};

export const deleteWorld = async (worldSlug: string): Promise<void> => {
  const dbName = `${DB_PREFIX}${worldSlug}`;
  const metaDb = await getMetadataDb();
  const store = metaDb
    .transaction(WORLDS_METADATA_STORE_NAME, "readwrite")
    .objectStore(WORLDS_METADATA_STORE_NAME);
  store.delete(worldSlug);

  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error);
    deleteRequest.onblocked = () => {
      console.warn(`Deletion of database ${dbName} is blocked.`);
      reject(new Error(`Deletion of database ${dbName} is blocked.`));
    };
  });
};

export const renameWorld = async (oldSlug: string, newName: string) => {
  const newSlug = newName.trim().toLowerCase().replace(/\s+/g, "-");
  const data = await exportWorldData(oldSlug);

  setWorldDbName(newSlug);
  await importData(data);

  // Add new metadata
  const metaDb = await getMetadataDb();
  const metaTx = metaDb.transaction(WORLDS_METADATA_STORE_NAME, "readwrite");
  const metaStore = metaTx.objectStore(WORLDS_METADATA_STORE_NAME);
  const newMetadata: WorldMetadata = {
    slug: newSlug,
    name: newName,
    description:
      data[WORLDS_METADATA_STORE_NAME]?.[0]?.description ||
      "A world of adventure awaits...",
  };
  metaStore.put(newMetadata);

  await deleteWorld(oldSlug);
};

export const getDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db && db.name === DB_NAME) {
      return resolve(db);
    }
    if (typeof window === "undefined") {
      return reject("IndexedDB can only be used in a browser environment.");
    }
    if (!DB_NAME) {
      return reject("Database name is not set. Please select a world.");
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const currentDb = request.result;

      const createStore = (name: string, keyPath = "id") => {
        if (!currentDb.objectStoreNames.contains(name)) {
          currentDb.createObjectStore(name, { keyPath });
        }
      };

      ALL_STORE_NAMES.forEach((name) => createStore(name));

      const tagsStore = currentDb.objectStoreNames.contains(TAGS_STORE_NAME)
        ? request.transaction!.objectStore(TAGS_STORE_NAME)
        : currentDb.createObjectStore(TAGS_STORE_NAME, {
            keyPath: "id",
          });
      if (!tagsStore.indexNames.contains("by_source")) {
        tagsStore.createIndex("by_source", "source", { unique: false });
      }

      const eventsStore = currentDb.objectStoreNames.contains(
        CALENDAR_EVENTS_STORE_NAME
      )
        ? request.transaction!.objectStore(CALENDAR_EVENTS_STORE_NAME)
        : currentDb.createObjectStore(CALENDAR_EVENTS_STORE_NAME, {
            keyPath: "id",
          });
      if (!eventsStore.indexNames.contains("by_calendar")) {
        eventsStore.createIndex("by_calendar", "calendarId", { unique: false });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };
  });
};

export const generateId = () => crypto.randomUUID();
