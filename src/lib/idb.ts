
"use client";

import type { Creature, Deed, DeedData, Encounter, EncounterTable, NewCreature, Tag, Treasure, NewTreasure, AlchemicalItem, NewAlchemicalItem, TagSource, Room, NewRoom } from '@/lib/types';

const DB_NAME = 'TresspasserBestiaryDB';
const DB_VERSION = 9;
const CREATURES_STORE_NAME = 'creatures';
const DEEDS_STORE_NAME = 'deeds';
const ENCOUNTERS_STORE_NAME = 'encounters';
const TAGS_STORE_NAME = 'tags';
const ENCOUNTER_TABLES_STORE_NAME = 'encounterTables';
const TREASURES_STORE_NAME = 'treasures';
const ALCHEMY_ITEMS_STORE_NAME = 'alchemicalItems';
const ROOMS_STORE_NAME = 'rooms';

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
      
      if (db.objectStoreNames.contains(TAGS_STORE_NAME)) {
          db.deleteObjectStore(TAGS_STORE_NAME);
      }
      const tagsStore = db.createObjectStore(TAGS_STORE_NAME, { keyPath: ['name', 'source'] });
      tagsStore.createIndex('by_source', 'source', { unique: false });

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

// Alchemical Item Functions
export const getAllAlchemicalItems = async (): Promise<AlchemicalItem[]> => {
    const db = await getDb();
    const store = db.transaction(ALCHEMY_ITEMS_STORE_NAME, 'readonly').objectStore(ALCHEMY_ITEMS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getAlchemicalItemById = async (id: string): Promise<AlchemicalItem | undefined> => {
    const db = await getDb();
    const store = db.transaction(ALCHEMY_ITEMS_STORE_NAME, 'readonly').objectStore(ALCHEMY_ITEMS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addAlchemicalItem = async (itemData: NewAlchemicalItem): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(ALCHEMY_ITEMS_STORE_NAME, 'readwrite').objectStore(ALCHEMY_ITEMS_STORE_NAME);
    const id = generateId();
    const itemWithId = { ...itemData, id };
    const request = store.add(itemWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateAlchemicalItem = async (item: AlchemicalItem): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ALCHEMY_ITEMS_STORE_NAME, 'readwrite').objectStore(ALCHEMY_ITEMS_STORE_NAME);
    const request = store.put(item);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteAlchemicalItem = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ALCHEMY_ITEMS_STORE_NAME, 'readwrite').objectStore(ALCHEMY_ITEMS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Room Functions
export const getAllRooms = async (): Promise<Room[]> => {
    const db = await getDb();
    const store = db.transaction(ROOMS_STORE_NAME, 'readonly').objectStore(ROOMS_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getRoomById = async (id: string): Promise<Room | undefined> => {
    const db = await getDb();
    const store = db.transaction(ROOMS_STORE_NAME, 'readonly').objectStore(ROOMS_STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addRoom = async (roomData: NewRoom): Promise<string> => {
    const db = await getDb();
    const store = db.transaction(ROOMS_STORE_NAME, 'readwrite').objectStore(ROOMS_STORE_NAME);
    const id = generateId();
    const roomWithId = { ...roomData, id };
    const request = store.add(roomWithId);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const updateRoom = async (room: Room): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ROOMS_STORE_NAME, 'readwrite').objectStore(ROOMS_STORE_NAME);
    const request = store.put(room);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteRoom = async (id: string): Promise<void> => {
    const db = await getDb();
    const store = db.transaction(ROOMS_STORE_NAME, 'readwrite').objectStore(ROOMS_STORE_NAME);
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Tag Functions
export const getTagsBySource = async (source: TagSource): Promise<Tag[]> => {
    const db = await getDb();
    const store = db.transaction(TAGS_STORE_NAME, 'readonly').objectStore(TAGS_STORE_NAME);
    const index = store.index('by_source');
    const request = index.getAll(source);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

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

export const addTags = async (tagNames: string[], source: TagSource): Promise<void> => {
    if (!tagNames || tagNames.length === 0) return;
    await Promise.all(tagNames.map(name => addTag({ name, source })));
};

// Helper function to get all items with tags from a specific store
const getTaggableItems = async (storeName: string, db: IDBDatabase): Promise<{ tags?: string[] }[]> => {
    const store = db.transaction(storeName, 'readonly').objectStore(storeName);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getTopTagsBySource = async (source: TagSource, limit: number): Promise<string[]> => {
    const db = await getDb();
    let storeName: string;

    switch (source) {
        case 'creature': storeName = CREATURES_STORE_NAME; break;
        case 'deed': storeName = DEEDS_STORE_NAME; break;
        case 'encounter': storeName = ENCOUNTERS_STORE_NAME; break;
        case 'encounterTable': storeName = ENCOUNTER_TABLES_STORE_NAME; break;
        case 'treasure': storeName = TREASURES_STORE_NAME; break;
        case 'alchemicalItem': storeName = ALCHEMY_ITEMS_STORE_NAME; break;
        case 'room': storeName = ROOMS_STORE_NAME; break;
        default: return [];
    }

    const items = await getTaggableItems(storeName, db);
    
    const tagCounts = new Map<string, number>();
    for (const item of items) {
        if (item.tags && Array.isArray(item.tags)) {
            for (const tag of item.tags) {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
        }
    }

    const sortedTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .map(entry => entry[0]); // Get just the tag name

    return sortedTags.slice(0, limit);
};


// Import/Export
export const exportAllData = async (): Promise<{ creatures: Creature[], deeds: Deed[], encounters: Encounter[], tags: Tag[], encounterTables: EncounterTable[], treasures: Treasure[], alchemicalItems: AlchemicalItem[], rooms: Room[] }> => {
    const db = await getDb();
    const transaction = db.transaction([CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, TAGS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME, ALCHEMY_ITEMS_STORE_NAME, ROOMS_STORE_NAME], 'readonly');
    
    const creaturesPromise = transaction.objectStore(CREATURES_STORE_NAME).getAll();
    const deedsPromise = transaction.objectStore(DEEDS_STORE_NAME).getAll();
    const encountersPromise = transaction.objectStore(ENCOUNTERS_STORE_NAME).getAll();
    const tagsPromise = transaction.objectStore(TAGS_STORE_NAME).getAll();
    const encounterTablesPromise = transaction.objectStore(ENCOUNTER_TABLES_STORE_NAME).getAll();
    const treasuresPromise = transaction.objectStore(TREASURES_STORE_NAME).getAll();
    const alchemicalItemsPromise = transaction.objectStore(ALCHEMY_ITEMS_STORE_NAME).getAll();
    const roomsPromise = transaction.objectStore(ROOMS_STORE_NAME).getAll();

    return new Promise((resolve, reject) => {
        const results: any = {};
        let completed = 0;
        const promises = [creaturesPromise, deedsPromise, encountersPromise, tagsPromise, encounterTablesPromise, treasuresPromise, alchemicalItemsPromise, roomsPromise];
        const names = ['creatures', 'deeds', 'encounters', 'tags', 'encounterTables', 'treasures', 'alchemicalItems', 'rooms'];
        
        promises.forEach((p, i) => {
            p.onsuccess = () => {
                results[names[i]] = p.result;
                completed++;
                if (completed === promises.length) {
                    resolve(results);
                }
            };
            p.onerror = () => reject(p.error);
        });
    });
};

export const importData = async (data: any): Promise<void> => {
    const db = await getDb();

    if (typeof data !== 'object' || data === null) {
        return Promise.reject(new Error("Invalid import file format. Expected an object with arrays of data."));
    }

    const storeNames = [CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, TAGS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME, ALCHEMY_ITEMS_STORE_NAME, ROOMS_STORE_NAME];
    const tx = db.transaction(storeNames, 'readwrite');
    
    const stores: { [key: string]: IDBObjectStore } = {};
    storeNames.forEach(name => {
      stores[name] = tx.objectStore(name);
      stores[name].clear();
    });

    const allTagsToCreate = new Map<string, Tag>();

    const processTags = (tags: string[] | undefined, source: TagSource) => {
        if (tags && Array.isArray(tags)) {
            tags.forEach(tagName => {
                const key = `${tagName}|${source}`;
                if (!allTagsToCreate.has(key)) {
                    allTagsToCreate.set(key, { name: tagName, source });
                }
            });
        }
    };

    if (data.creatures && Array.isArray(data.creatures)) {
        data.creatures.forEach((item: Creature) => {
            stores[CREATURES_STORE_NAME].put(item);
            processTags(item.tags, 'creature');
        });
    }
    if (data.deeds && Array.isArray(data.deeds)) {
        data.deeds.forEach((item: Deed) => {
            stores[DEEDS_STORE_NAME].put(item);
            processTags(item.tags, 'deed');
        });
    }
    if (data.encounters && Array.isArray(data.encounters)) {
        data.encounters.forEach((item: Encounter) => {
            stores[ENCOUNTERS_STORE_NAME].put(item);
            processTags(item.tags, 'encounter');
        });
    }
    if (data.encounterTables && Array.isArray(data.encounterTables)) {
        data.encounterTables.forEach((item: EncounterTable) => {
            stores[ENCOUNTER_TABLES_STORE_NAME].put(item);
            processTags(item.tags, 'encounterTable');
        });
    }
    if (data.treasures && Array.isArray(data.treasures)) {
        data.treasures.forEach((item: Treasure) => {
            stores[TREASURES_STORE_NAME].put(item);
            processTags(item.tags, 'treasure');
        });
    }
    if (data.alchemicalItems && Array.isArray(data.alchemicalItems)) {
        data.alchemicalItems.forEach((item: AlchemicalItem) => {
            stores[ALCHEMY_ITEMS_STORE_NAME].put(item);
            processTags(item.tags, 'alchemicalItem');
        });
    }
    if (data.rooms && Array.isArray(data.rooms)) {
        data.rooms.forEach((item: Room) => {
            stores[ROOMS_STORE_NAME].put(item);
            processTags(item.tags, 'room');
        });
    }
    
    allTagsToCreate.forEach(tag => {
        stores[TAGS_STORE_NAME].put(tag);
    });
    
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};
