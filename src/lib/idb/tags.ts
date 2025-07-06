
"use client";

import type { Tag, TagSource } from '@/lib/types';
import { getDb, TAGS_STORE_NAME, CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME, ALCHEMY_ITEMS_STORE_NAME, ROOMS_STORE_NAME, ITEMS_STORE_NAME, FACTIONS_STORE_NAME, NPCS_STORE_NAME } from './db';

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
        case 'item': storeName = ITEMS_STORE_NAME; break;
        case 'faction': storeName = FACTIONS_STORE_NAME; break;
        case 'npc': storeName = NPCS_STORE_NAME; break;
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
