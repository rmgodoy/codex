import type { Role } from './roles';

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
