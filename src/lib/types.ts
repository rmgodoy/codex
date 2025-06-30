export interface MonsterAttributes {
  strength: number;
  agility: number;
  mind: number;
  charm: number;
}

export interface MonsterSkill {
  name: string;
  rating: number;
}

export interface Monster {
  id: string;
  name: string;
  level: number;
  attributes: MonsterAttributes;
  skills: MonsterSkill[];
  abilities: string;
  description: string;
}

export type NewMonster = Omit<Monster, 'id'>;
