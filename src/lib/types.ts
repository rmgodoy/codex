

import type { Role } from './roles';
import type { StateEffect } from './states';

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
  shadow: string;
  end?: string;
}

export interface Deed {
  id: string;
  name: string;
  tier: 'light' | 'heavy' | 'mighty';
  target: string;
  range: string;
  effects: DeedEffects;
  tags?: string[];
}

export type DeedData = Omit<Deed, 'id'>;


export interface Creature {
  id: string;
  name: string;
  level: number;
  role: Role;
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
  effect?: StateEffect;
}

interface BaseCombatant {
  id: string;
  name: string;
  initiative: number;
  currentHp: number;
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
  maxHp: number;
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
}
