

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

export interface DeedEffects {
  start?: string;
  base?: string;
  hit?: string;
  shadow?: string;
  end?: string;
}

export const DEED_ACTION_TYPES = ['attack', 'support'] as const;
export type DeedActionType = (typeof DEED_ACTION_TYPES)[number];

export const DEED_TYPES = ['melee', 'missile', 'innate', 'unarmed', 'spell', 'item', 'versatile'] as const;
export type DeedType = (typeof DEED_TYPES)[number];

export const DEED_VERSUS = ['guard', 'resist', '10', 'special'] as const;
export type DeedVersus = (typeof DEED_VERSUS)[number];

export type DeedTier = 'light' | 'heavy' | 'mighty';

export type TagSource = 'creature' | 'deed' | 'encounter' | 'encounterTable' | 'treasure' | 'alchemicalItem';

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
  abilities: string;
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
  abilities: string;
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
