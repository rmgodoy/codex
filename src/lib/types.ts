

import type { Role } from './roles';
import type { StateEffect } from './states';

export type CreatureTemplate = 'Normal' | 'Underling' | 'Paragon' | 'Tyrant';

export interface CreatureAttributes {
  HP: number;
  Speed: number;
  Initiative: number;
  Accuracy: number;
  Guard: number;
  Resist: number;
  rollBonus: number;
  DMG: string;
}

export interface CreatureAbility {
  id: string;
  name: string;
  description: string;
}

export interface DeedEffects {
  start?: string;
  base?: string;
  hit?: string;
  spark?: string;
  shadow?: string;
  after?: string;
}

export const DEED_ACTION_TYPES = ['attack', 'support'] as const;
export type DeedActionType = (typeof DEED_ACTION_TYPES)[number];

export const DEED_TYPES = ['melee', 'missile', 'innate', 'unarmed', 'spell', 'item', 'versatile'] as const;
export type DeedType = (typeof DEED_TYPES)[number];

export const DEED_VERSUS = ['guard', 'resist', '10', 'special'] as const;
export type DeedVersus = (typeof DEED_VERSUS)[number];

export type DeedTier = 'light' | 'heavy' | 'mighty' | 'tyrant' | 'special';

export type TagSource = 'creature' | 'deed' | 'encounter' | 'encounterTable' | 'treasure' | 'alchemicalItem' | 'room' | 'dungeon' | 'item' | 'npc' | 'faction' | 'calendar' | 'pantheon';

export interface Tag {
  name: string;
  source: TagSource;
}

export interface Deed {
  id: string;
  name: string;
  tier: DeedTier;
  actionType: DeedActionType;
  deedType: DeedType;
  versus: DeedVersus;
  target: string;
  effects: DeedEffects;
  tags?: string[];
}

export type DeedData = Omit<Deed, 'id'>;


export interface Creature {
  id: string;
  name: string;
  level: number;
  role: Role;
  template: CreatureTemplate;
  TR: number;
  attributes: CreatureAttributes;
  deeds: string[];
  abilities: CreatureAbility[];
  description: string;
  tags: string[];
}

export type NewCreature = Omit<Creature, 'id'>;

// Helper type for UI, with full deed objects
export interface CreatureWithDeeds extends Omit<Creature, 'deeds'> {
  deeds: Deed[];
}

// Encounter Types
export interface CombatantState {
  id: string;
  name: string;
  intensity: number;
  description?: string;
  effects?: StateEffect[];
}

interface BaseCombatant {
  id: string;
  name: string;
  initiative: number;
  states: CombatantState[];
}

export interface PlayerCombatant {
  id: string;
  type: 'player';
  name: string;
  initiative: number;
  nat20?: boolean;
}

export interface MonsterCombatant extends BaseCombatant {
  type: 'monster';
  monsterId: string; // Original creature ID from bestiary
  template: CreatureTemplate;
  maxHp: number;
  currentHp: number;
  attributes: CreatureAttributes;
  deeds: Deed[];
  abilities: CreatureAbility[];
  description: string;
  tags: string[];
  role: Role;
  level: number;
  TR: number;
}

export type Combatant = PlayerCombatant | MonsterCombatant;

export interface MonsterEncounterGroup {
  monsterId: string;
  quantity: number;
}

export interface PlayerEncounterEntry {
  id: string;
  name: string;
}

export interface Encounter {
  id: string;
  name: string;
  sceneDescription: string;
  gmNotes: string;
  monsterGroups: MonsterEncounterGroup[];
  players: PlayerEncounterEntry[];
  tags?: string[];
  totalTR?: number;
  encounterTableId?: string;
}


// Encounter Table Types
export interface EncounterTableEntry {
  id: string;
  creatureId: string;
  quantity: string;
  weight: number;
}

export interface EncounterTable {
  id: string;
  name: string;
  description: string;
  location: string;
  tags: string[];
  totalTR: number;
  entries: EncounterTableEntry[];
}

// Treasure Types
export interface Treasure {
  id: string;
  name: string;
  description: string;
  value: number;
  slots: string;
  material: string;
  gemstone: string;
  tags: string[];
  isGenerated: boolean;
}

export type NewTreasure = Omit<Treasure, 'id'>;


// Commoner Type
export interface CommonerCombatValues {
  skillBonus: number;
  skillDie: string;
  hp: number;
  speed: number;
  initiative: number;
  accuracy: number;
  guard: number;
  resist: number;
  prevail: number;
  tenacity: number;
}

export interface Commoner {
  id: string;
  attributes: {
    might: number;
    agility: number;
    intellect: number;
    spirit: number;
  };
  keyAttribute: 'Might' | 'Agility';
  alignment: string;
  pastLife: string;
  skill: string;
  equipment: string;
  combatValues: CommonerCombatValues;
}

// Alchemy Types
export const ALCHEMY_ITEM_TYPES = ['potion', 'powder', 'oil', 'bomb'] as const;
export type AlchemicalItemType = (typeof ALCHEMY_ITEM_TYPES)[number];

export const ALCHEMY_ITEM_TIERS = ['lesser', 'greater'] as const;
export type AlchemicalItemTier = (typeof ALCHEMY_ITEM_TIERS)[number];

export interface AlchemicalItem {
  id: string;
  name: string;
  type: AlchemicalItemType;
  tier: AlchemicalItemTier;
  cost: number;
  effect: string;
  tags: string[];
}

export type NewAlchemicalItem = Omit<AlchemicalItem, 'id'>;

// Room Types
export interface RoomFeature {
  id: string;
  title: string;
  description: string;
  encounterIds: string[];
  treasureIds: string[];
  alchemicalItemIds: string[];
}

export interface Room {
  id: string;
  name: string;
  description: string;
  size: string;
  features: RoomFeature[];
  tags: string[];
  totalTreasureValue: number;
}

export type NewRoom = Omit<Room, 'id'>;

// Dungeon Types
export type DungeonHostilityLevel = 'I' | 'II' | 'III' | 'IV' | 'V';
export type DungeonSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge';

export interface DungeonRoom {
  instanceId: string; // A unique ID for this instance in the dungeon
  roomId: string; // The ID of the room template from the main rooms list
  position: { x: number; y: number };
}

export interface DungeonConnection {
  from: string; // DungeonRoom instanceId
  to: string; // DungeonRoom instanceId
}

export interface Dungeon {
    id: string;
    name: string;
    description: string;
    hostility: DungeonHostilityLevel;
    size: DungeonSize;
    threatRating: number;
    treasureValue: number;
    tags: string[];
    rooms: DungeonRoom[];
    connections: DungeonConnection[];
}

export type NewDungeon = Omit<Dungeon, 'id'>;

// Item Types
export const ITEM_TYPES = ['weapon', 'armor', 'shield', 'tool'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_QUALITIES = ['crude', 'normal', 'fine'] as const;
export type ItemQuality = (typeof ITEM_QUALITIES)[number];

export const ITEM_MAGIC_TIERS = ['normal', 'magical', 'artifact'] as const;
export type ItemMagicTier = (typeof ITEM_MAGIC_TIERS)[number];

export const WEAPON_TYPES = ['melee', 'missile', 'spell', 'unarmed'] as const;
export type WeaponType = (typeof WEAPON_TYPES)[number];

export const WEAPON_DAMAGE_DIES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as const;
export type WeaponDamageDie = (typeof WEAPON_DAMAGE_DIES)[number];

export const WEAPON_PROPERTIES = ['one-handed', 'two-handed', 'thrown'] as const;
export type WeaponProperty = (typeof WEAPON_PROPERTIES)[number];

export const ARMOR_PLACEMENTS = ['head', 'chest', 'arms', 'legs', 'outer'] as const;
export const ITEM_PLACEMENTS = ['head', 'chest', 'arms', 'legs', 'outer', 'shield'] as const;
export type ItemPlacement = (typeof ITEM_PLACEMENTS)[number];

export const ARMOR_WEIGHTS = ['None', 'Light', 'Heavy'] as const;
export type ArmorWeight = (typeof ARMOR_WEIGHTS)[number];

export const ARMOR_DIES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as const;
export type ArmorDie = (typeof ARMOR_DIES)[number];

export interface Item {
    id: string;
    name: string;
    type: ItemType;
    price: number;
    quality: ItemQuality;
    description: string;
    magicTier: ItemMagicTier;
    enchantment?: string;
    assignedDeedId?: string;
    magicalTrait?: string;
    tags?: string[];
    
    // Weapon fields
    damageDie?: WeaponDamageDie;
    weaponType?: WeaponType;
    range?: number;
    property?: WeaponProperty;
    weaponEffect?: string;

    // Armor/Shield fields
    placement?: ItemPlacement;
    weight?: ArmorWeight;
    AR?: string;
    armorDie?: ArmorDie;
}

export type NewItem = Omit<Item, 'id'>;

// Faction Types
export interface Faction {
  id: string;
  name: string;
  description: string;
  goals: string;
  tags: string[];
}

export type NewFaction = Omit<Faction, 'id'>;

// NPC Types
export interface NpcRelationship {
  id: string;
  targetNpcId: string;
  type: string;
}

export interface Npc {
  id: string;
  name: string;
  personality: string;
  motivation: string;
  backstory: string;
  role: string;
  age: string;
  appearance: string;
  race: string;
  factionIds?: string[];
  tags: string[];
  relationships?: NpcRelationship[];
}

export type NewNpc = Omit<Npc, 'id'>;

// Pantheon Types
export interface PantheonRelationship {
  id: string;
  targetEntityId: string;
  type: string;
}

export interface PantheonEntity {
  id: string;
  name: string;
  entityType: string;
  domain: string;
  symbols: string;
  followers: string;
  artifactId?: string;
  relationships: PantheonRelationship[];
  goal: string;
  lore: string;
  tags: string[];
}

export type NewPantheonEntity = Omit<PantheonEntity, 'id'>;

// Hex Grid Types (before Calendar)
export interface Hex {
    q: number; // Corresponds to column
    r: number; // Corresponds to row
    s: number; // s = -q - r
}

// Calendar Types
export const CALENDAR_PARTY_TYPES = ['faction', 'creature', 'npc'] as const;
export type CalendarPartyType = (typeof CALENDAR_PARTY_TYPES)[number];

export interface Calendar {
  id: string;
  name: string;
}
export type NewCalendar = Omit<Calendar, 'id'>;

export interface CalendarEvent {
    id: string;
    calendarId: string;
    title: string;
    description: string;
    startDate: string; // ISO string
    endDate: string; // ISO string
    tags: string[];
    party?: {
        type: CalendarPartyType;
        id: string;
        name: string;
    };
    location?: {
        mapId: string;
        hex: Hex;
    };
}

export type NewCalendarEvent = Omit<CalendarEvent, 'id'>;

// Hex Grid Types
export interface HexTileData {
    color?: string;
    icon?: string;
    iconColor?: string;
    dungeonIds?: string[];
    factionIds?: string[];
}

export interface HexTile {
    hex: Hex;
    data: HexTileData; // For storing metadata
}

export interface Map {
  id: string;
  name: string;
  radius: number;
  tiles: HexTile[];
}

export type NewMap = Omit<Map, 'id'>;
