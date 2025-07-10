

"use client";

import type { Creature, Deed, Encounter, EncounterTable, Tag, Treasure, AlchemicalItem, Room, Dungeon, Item, Faction, Npc, TagSource, CreatureAbility, Calendar, CalendarEvent, Map, PantheonEntity, Path } from '@/lib/types';
import { getDb, generateId, CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, TAGS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME, ALCHEMY_ITEMS_STORE_NAME, ROOMS_STORE_NAME, DUNGEONS_STORE_NAME, ITEMS_STORE_NAME, FACTIONS_STORE_NAME, NPCS_STORE_NAME, CALENDARS_STORE_NAME, CALENDAR_EVENTS_STORE_NAME, MAPS_STORE_NAME, PANTHEON_STORE_NAME } from './db';

// Import/Export
export const exportAllData = async (): Promise<any> => {
    const db = await getDb();
    const storeNames = [CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, TAGS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME, ALCHEMY_ITEMS_STORE_NAME, ROOMS_STORE_NAME, DUNGEONS_STORE_NAME, ITEMS_STORE_NAME, FACTIONS_STORE_NAME, NPCS_STORE_NAME, PANTHEON_STORE_NAME, CALENDARS_STORE_NAME, CALENDAR_EVENTS_STORE_NAME, MAPS_STORE_NAME];
    const transaction = db.transaction(storeNames, 'readonly');
    
    const promises = storeNames.map(name => {
      return new Promise((resolve, reject) => {
        const request = transaction.objectStore(name).getAll();
        request.onsuccess = () => resolve({ name, data: request.result });
        request.onerror = () => reject(request.error);
      });
    });

    const resultsArray = await Promise.all(promises);
    const results: Record<string, any> = {};
    resultsArray.forEach((res: any) => {
      results[res.name] = res.data;
    });

    return results;
};

export const importData = async (data: any): Promise<void> => {
    const db = await getDb();

    if (typeof data !== 'object' || data === null) {
        return Promise.reject(new Error("Invalid import file format. Expected an object with arrays of data."));
    }

    const storeNames = [CREATURES_STORE_NAME, DEEDS_STORE_NAME, ENCOUNTERS_STORE_NAME, TAGS_STORE_NAME, ENCOUNTER_TABLES_STORE_NAME, TREASURES_STORE_NAME, ALCHEMY_ITEMS_STORE_NAME, ROOMS_STORE_NAME, DUNGEONS_STORE_NAME, ITEMS_STORE_NAME, FACTIONS_STORE_NAME, NPCS_STORE_NAME, PANTHEON_STORE_NAME, CALENDARS_STORE_NAME, CALENDAR_EVENTS_STORE_NAME, MAPS_STORE_NAME];
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
            let abilitiesAsArray: CreatureAbility[] = [];
            if (typeof (item as any).abilities === 'string' && (item as any).abilities.length > 0) {
              abilitiesAsArray = (item as any).abilities.split('\n\n').map((abilityStr: string) => {
                  const match = abilityStr.match(/\*\*(.*?):\*\*\s*(.*)/s);
                  if (match && match[1] && match[2]) {
                      return { id: crypto.randomUUID(), name: match[1], description: match[2].trim() };
                  }
                  if (!match && abilityStr.trim()) {
                      return { id: crypto.randomUUID(), name: 'Ability', description: abilityStr.trim() };
                  }
                  return null;
              }).filter((a: any): a is CreatureAbility => a !== null);
            } else if (Array.isArray(item.abilities)) {
              abilitiesAsArray = item.abilities.map(a => ({...a, id: a.id || crypto.randomUUID()}));
            }
            const migratedItem = { ...item, abilities: abilitiesAsArray };
            stores[CREATURES_STORE_NAME].put(migratedItem);
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
    if (data.dungeons && Array.isArray(data.dungeons)) {
        data.dungeons.forEach((item: Dungeon) => {
            stores[DUNGEONS_STORE_NAME].put(item);
            processTags(item.tags, 'dungeon');
        });
    }
    if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: Item) => {
            stores[ITEMS_STORE_NAME].put(item);
            processTags(item.tags, 'item');
        });
    }
    if (data.factions && Array.isArray(data.factions)) {
        data.factions.forEach((item: Faction) => {
            stores[FACTIONS_STORE_NAME].put(item);
            processTags(item.tags, 'faction');
        });
    }
    if (data.npcs && Array.isArray(data.npcs)) {
        data.npcs.forEach((item: Npc & { factionId?: string }) => {
            const migratedItem: any = { ...item };
            if (migratedItem.factionId && (!migratedItem.factionIds || migratedItem.factionIds.length === 0)) {
                migratedItem.factionIds = [migratedItem.factionId];
            }
            delete migratedItem.factionId;
            stores[NPCS_STORE_NAME].put(migratedItem);
            processTags(item.tags, 'npc');
        });
    }
    if (data.pantheon && Array.isArray(data.pantheon)) {
        data.pantheon.forEach((item: PantheonEntity) => {
            stores[PANTHEON_STORE_NAME].put(item);
            processTags(item.tags, 'pantheon');
        });
    }
    if (data.calendars && Array.isArray(data.calendars)) {
        data.calendars.forEach((item: Calendar) => {
            stores[CALENDARS_STORE_NAME].put(item);
        });
    }
    
    let defaultCalendarId: string | null = null;
    if (data.calendarEvents && Array.isArray(data.calendarEvents)) {
        data.calendarEvents.forEach((item: CalendarEvent) => {
            if (!item.calendarId) {
                if (!defaultCalendarId) {
                    const existingCalendars = data.calendars || [];
                    if (existingCalendars.length > 0) {
                        defaultCalendarId = existingCalendars[0].id;
                    } else {
                        const defaultCalendar = { id: generateId(), name: 'Default Calendar' };
                        stores[CALENDARS_STORE_NAME].put(defaultCalendar);
                        defaultCalendarId = defaultCalendar.id;
                    }
                }
                item.calendarId = defaultCalendarId!;
            }
            stores[CALENDAR_EVENTS_STORE_NAME].put(item);
            processTags(item.tags, 'calendar');
        });
    }
     if (data.maps && Array.isArray(data.maps)) {
        data.maps.forEach((item: Map) => {
            const migratedMap = { ...item, paths: item.paths || [] };
            stores[MAPS_STORE_NAME].put(migratedMap);
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
