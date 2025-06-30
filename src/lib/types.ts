

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
  hit: string;
  shadow?: string;
  end?: string;
}

export const DEED_ACTION_TYPES = ['attack', 'support'] as const;
export type DeedActionType = (typeof DEED_ACTION_TYPES)[number];

export const DEED_TYPES = ['melee', 'missile', 'innate', 'unarmed', 'spell', 'item', 'versatile'] as const;
export type DeedType = (typeof DEED_TYPES)[number];

export const DEED_VERSUS = ['guard', 'resist', '10', 'special'] as const;
export type DeedVersus = (typeof DEED_VERSUS)[number];

export interface Deed {
  id: string;
  name: string;
  tier: 'light' | 'heavy' | 'mighty';
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
}
