
"use client";

import type { Creature, Deed, DeedData, Encounter, EncounterTable, NewCreature, Tag, Treasure, NewTreasure } from '@/lib/types';

const DB_NAME = 'TresspasserBestiaryDB';
const DB_VERSION = 6;
const CREATURES_STORE_NAME = 'creatures';
const DEEDS_STORE_NAME = 'deeds';
const ENCOUNTERS_STORE_NAME = 'encounters';
const TAGS_STORE_NAME = 'tags';
const ENCOUNTER_TABLES_STORE_NAME = 'encounterTables';
const TREASURES_STORE_NAME = 'treasures';

const getDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject('IndexedDB can only be used in a browser environment.');
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
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
        db.createObjectStore(TAGS_STORE_NAME, { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains(ENCOUNTER_TABLES_STORE_NAME)) {
        db.createObjectStore(ENCOUNTER_TABLES_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(TREASURES_STORE_NAME)) {
        db.createObjectStore(TREASURES_STORE_NAME, { keyPath: 'id' });
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

const generateId = () => crypto.randomUUID();

// Creature Functions
export const getAllCreatures = async (): Promise<Creature[]> => {
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readonly').objectStore(CREATURES_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getCreatureById = async (id: string): Promise<Creature | undefined> => {
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readonly').objectStore(CREATURES_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getCreaturesByIds = async (ids: string[]): Promise<Creature[]> => {
    if (!ids || ids.length === 0) return [];
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readonly').objectStore(CREATURES_STORE_NAME);
    
    const results: Creature[] = [];
    const promises = ids.map(id => {
        return new Promise<void>((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                if (request.result) {
                    results.push(request.result);
                }
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    });

    await Promise.all(promises);
    return results;
};


export const addCreature = async (creatureData: NewCreature): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readwrite').objectStore(CREATURES_STORE_NAME);
    const id = generateId();
    const creatureWithId = { ...creatureData, id };
    const request = store.add(creatureWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateCreature = async (creature: Creature): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readwrite').objectStore(CREATURES_STORE_NAME);
    const request = store.put(creature);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteCreature = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(CREATURES_STORE_NAME, 'readwrite').objectStore(CREATURES_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Deed Functions
export const getAllDeeds = async (): Promise<Deed[]> => {
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readonly').objectStore(DEEDS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getDeedById = async (id: string): Promise<Deed | undefined> => {
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readonly').objectStore(DEEDS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addDeed = async (deedData: DeedData): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readwrite').objectStore(DEEDS_STORE_NAME);
    const id = generateId();
    const deedWithId = { ...deedData, id };
    const request = store.add(deedWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateDeed = async (deed: Deed): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readwrite').objectStore(DEEDS_STORE_NAME);
    const request = store.put(deed);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteDeed = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readwrite').objectStore(DEEDS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};


export const getDeedsByIds = async (ids: string[]): Promise<Deed[]> => {
    if (!ids || ids.length === 0) return [];
    const db = await getDb();
    const store = db.transaction(DEEDS_STORE_NAME, 'readonly').objectStore(DEEDS_STORE_NAME);
    
    const results: Deed[] = [];
    const promises = ids.map(id => {
        return new Promise<void>((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                if (request.result) {
                    results.push(request.result);
                }
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    });

    await Promise.all(promises);
    return results;
};

// Encounter Functions
export const getAllEncounters = async (): Promise<Encounter[]> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTERS_STORE_NAME, 'readonly').objectStore(ENCOUNTERS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getEncounterById = async (id: string): Promise<Encounter | undefined> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTERS_STORE_NAME, 'readonly').objectStore(ENCOUNTERS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addEncounter = async (encounterData: Omit<Encounter, 'id'>): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTERS_STORE_NAME, 'readwrite').objectStore(ENCOUNTERS_STORE_NAME);
    const id = generateId();
    const encounterWithId = { ...encounterData, id };
    const request = store.add(encounterWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateEncounter = async (encounter: Encounter): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTERS_STORE_NAME, 'readwrite').objectStore(ENCOUNTERS_STORE_NAME);
    const request = store.put(encounter);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteEncounter = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTERS_STORE_NAME, 'readwrite').objectStore(ENCOUNTERS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};


// Encounter Table Functions
export const getAllEncounterTables = async (): Promise<EncounterTable[]> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTER_TABLES_STORE_NAME, 'readonly').objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getEncounterTableById = async (id: string): Promise<EncounterTable | undefined> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTER_TABLES_STORE_NAME, 'readonly').objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addEncounterTable = async (tableData: Omit<EncounterTable, 'id'>): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTER_TABLES_STORE_NAME, 'readwrite').objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const id = generateId();
    const tableWithId = { ...tableData, id };
    const request = store.add(tableWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateEncounterTable = async (table: EncounterTable): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTER_TABLES_STORE_NAME, 'readwrite').objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const request = store.put(table);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteEncounterTable = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ENCOUNTER_TABLES_STORE_NAME, 'readwrite').objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Treasure Functions
export const getAllTreasures = async (): Promise<Treasure[]> => {
    const db = await getDb();
    const store = db.transaction(TREASURES_STORE_NAME, 'readonly').objectStore(TREASURES_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getTreasureById = async (id: string): Promise<Treasure | undefined> => {
    const db = await getDb();
    const store = db.transaction(TREASURES_STORE_NAME, 'readonly').objectStore(TREASURES_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addTreasure = async (treasureData: NewTreasure): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(TREASURES_STORE_NAME, 'readwrite').objectStore(TREASURES_STORE_NAME);
    const id = generateId();
    const treasureWithId = { ...treasureData, id };
    const request = store.add(treasureWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateTreasure = async (treasure: Treasure): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(TREASURES_STORE_NAME, 'readwrite').objectStore(TREASURES_STORE_NAME);
    const request = store.put(treasure);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteTreasure = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(TREASURES_STORE_NAME, 'readwrite').objectStore(TREASURES_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Tag Functions
export const getAllTags = async (): Promise<Tag[]> => {
    const db = await getDb();
    const store = db.transaction(TAGS_STORE_NAME, 'readonly').objectStore(TAGS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addTag = async (tag: Tag): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(TAGS_STORE_NAME, 'readwrite').objectStore(TAGS_STORE_NAME);
    const request = store.add(tag);
     return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => {
            // Ignore "ConstraintError" which means the tag already exists.
            if (request.error?.name !== 'ConstraintError') {
                reject(request.error);
            } else {
                resolve();
            }
        };
    });
};

export const addTags = async (tagNames: string[]): Promise<void> => {
    if (!tagNames || tagNames.length === 0) return;
    await Promise.all(tagNames.map(name => addTag({ name })));
};


// Import/Export
export const exportAllData = async (): Promise<{ creatures: Creature[], deeds: Deed[], encounters: Encounter[], tags: Tag[], encounterTables: EncounterTable[], treasures: Treasure[] }> => {
    const db = await getDb();
    const transaction = db.transaction([CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, TAGS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME], 'readonly');
    
    const creaturesPromise = new Promise<Creature[]>((resolve, reject) => {
        const req = transaction.objectStore(CREATURES_STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    const deedsPromise = new Promise<Deed[]>((resolve, reject) => {
        const req = transaction.objectStore(DEEDS_STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    const encountersPromise = new Promise<Encounter[]>((resolve, reject) => {
        const req = transaction.objectStore(ENCOUNTERS_STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    
    const tagsPromise = new Promise<Tag[]>((resolve, reject) => {
        const req = transaction.objectStore(TAGS_STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    const encounterTablesPromise = new Promise<EncounterTable[]>((resolve, reject) => {
        const req = transaction.objectStore(ENCOUNTER_TABLES_STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    const treasuresPromise = new Promise<Treasure[]>((resolve, reject) => {
        const req = transaction.objectStore(TREASURES_STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    const [creatures, deeds, encounters, tags, encounterTables, treasures] = await Promise.all([creaturesPromise, deedsPromise, encountersPromise, tagsPromise, encounterTablesPromise, treasuresPromise]);
    return { creatures, deeds, encounters, tags, encounterTables, treasures };
};

export const importData = async (data: any): Promise<void> => {
    const db = await getDb();

    if (typeof data !== 'object' || data === null) {
        return Promise.reject(new Error("Invalid import file format. Expected an object with arrays of data."));
    }

    const tx = db.transaction([CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, TAGS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME], 'readwrite');
    const creatureStore = tx.objectStore(CREATURES_STORE_NAME);
    const deedStore = tx.objectStore(DEEDS_STORE_NAME);
    const encounterStore = tx.objectStore(ENCOUNTERS_STORE_NAME);
    const tagStore = tx.objectStore(TAGS_STORE_NAME);
    const encounterTableStore = tx.objectStore(ENCOUNTER_TABLES_STORE_NAME);
    const treasureStore = tx.objectStore(TREASURES_STORE_NAME);

    creatureStore.clear();
    deedStore.clear();
    encounterStore.clear();
    tagStore.clear();
    encounterTableStore.clear();
    treasureStore.clear();

    if (data.creatures && Array.isArray(data.creatures)) {
        data.creatures.forEach((creature: Creature) => creatureStore.put(creature));
    }
    if (data.deeds && Array.isArray(data.deeds)) {
        data.deeds.forEach((deed: Deed) => deedStore.put(deed));
    }
    if (data.encounters && Array.isArray(data.encounters)) {
        data.encounters.forEach((encounter: Encounter) => encounterStore.put(encounter));
    }
    if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: Tag) => tagStore.put(tag));
    }
    if (data.encounterTables && Array.isArray(data.encounterTables)) {
        data.encounterTables.forEach((table: EncounterTable) => encounterTableStore.put(table));
    }
    if (data.treasures && Array.isArray(data.treasures)) {
        data.treasures.forEach((treasure: Treasure) => treasureStore.put(treasure));
    }
    
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};
