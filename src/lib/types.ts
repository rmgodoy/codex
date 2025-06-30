
export interface CreatureAttributes {
  HP: number;
  Speed: number;
  Initiative: number;
  Accuracy: number;
  Guard: number;
  Resist: number;
  rollBonus: number;
}

export interface DeedEffects {
  start?: string;
  base?: string;
  hit: string;
  shadow: string;
  end?: string;
}

export interface Deed {
  name: string;
  tier: 'light' | 'heavy' | 'mighty';
  type: 'attack' | 'support';
  range: string;
  target: string;
  effects: DeedEffects;
}

export interface Creature {
  id: string;
  name: string;
  TR: number;
  attributes: CreatureAttributes;
  deeds: Deed[];
  abilities: string;
  description: string;
  tags: string[];
}

export type NewCreature = Omit<Creature, 'id'>;
