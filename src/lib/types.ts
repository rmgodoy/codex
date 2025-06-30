export interface CreatureAttributes {
  strength: number;
  agility: number;
  mind: number;
  charm: number;
}

export interface CreatureSkill {
  name: string;
  rating: number;
}

export interface Creature {
  id: string;
  name: string;
  level: number;
  attributes: CreatureAttributes;
  skills: CreatureSkill[];
  abilities: string;
  description: string;
  tags: string[];
}

export type NewCreature = Omit<Creature, 'id'>;
