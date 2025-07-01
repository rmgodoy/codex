
'use client';

import type { CreatureAttributes, CreatureTemplate } from './types';

export const ROLES = [
  'Archer',
  'Enchanter',
  'Enforcer',
  'Guardian',
  'Harrier',
  'Hellion',
  'Stalker',
  'Sorcerer',
] as const;

export type Role = (typeof ROLES)[number];

type RoleStatsData = Omit<CreatureAttributes, 'rollBonus' | 'DMG'> & {
  rollBonus: string;
  DMG: string;
  level: number;
};

const ROLE_STATS: Record<Role, RoleStatsData[]> = {
  Archer: [
    { level: 1, HP: 20, Initiative: 14, Accuracy: 16, Guard: 12, Resist: 12, rollBonus: '+4', Speed: 5, DMG: 'd6' },
    { level: 2, HP: 30, Initiative: 14, Accuracy: 16, Guard: 12, Resist: 12, rollBonus: '+4', Speed: 5, DMG: 'd6' },
    { level: 3, HP: 40, Initiative: 15, Accuracy: 17, Guard: 13, Resist: 13, rollBonus: '+5', Speed: 5, DMG: 'd6' },
    { level: 4, HP: 50, Initiative: 15, Accuracy: 17, Guard: 13, Resist: 13, rollBonus: '+5', Speed: 5, DMG: 'd8' },
    { level: 5, HP: 60, Initiative: 16, Accuracy: 18, Guard: 14, Resist: 14, rollBonus: '+6', Speed: 6, DMG: 'd8' },
    { level: 6, HP: 70, Initiative: 16, Accuracy: 18, Guard: 14, Resist: 14, rollBonus: '+6', Speed: 6, DMG: 'd8' },
    { level: 7, HP: 75, Initiative: 17, Accuracy: 19, Guard: 15, Resist: 15, rollBonus: '+7', Speed: 7, DMG: 'd10' },
    { level: 8, HP: 80, Initiative: 17, Accuracy: 19, Guard: 15, Resist: 15, rollBonus: '+7', Speed: 7, DMG: 'd10' },
    { level: 9, HP: 85, Initiative: 18, Accuracy: 20, Guard: 16, Resist: 16, rollBonus: '+8', Speed: 8, DMG: 'd10' },
    { level: 10, HP: 90, Initiative: 18, Accuracy: 20, Guard: 16, Resist: 16, rollBonus: '+8', Speed: 8, DMG: 'd12' },
  ],
  Enchanter: [
    { level: 1, HP: 20, Initiative: 12, Accuracy: 14, Guard: 16, Resist: 16, rollBonus: '+4', Speed: 5, DMG: 'd6' },
    { level: 2, HP: 30, Initiative: 12, Accuracy: 14, Guard: 16, Resist: 16, rollBonus: '+4', Speed: 5, DMG: 'd6' },
    { level: 3, HP: 40, Initiative: 13, Accuracy: 15, Guard: 17, Resist: 17, rollBonus: '+5', Speed: 5, DMG: 'd6' },
    { level: 4, HP: 50, Initiative: 13, Accuracy: 15, Guard: 17, Resist: 17, rollBonus: '+5', Speed: 5, DMG: 'd6' },
    { level: 5, HP: 60, Initiative: 14, Accuracy: 16, Guard: 18, Resist: 18, rollBonus: '+6', Speed: 6, DMG: 'd8' },
    { level: 6, HP: 70, Initiative: 14, Accuracy: 16, Guard: 18, Resist: 18, rollBonus: '+6', Speed: 6, DMG: 'd8' },
    { level: 7, HP: 80, Initiative: 15, Accuracy: 17, Guard: 19, Resist: 19, rollBonus: '+7', Speed: 7, DMG: 'd8' },
    { level: 8, HP: 90, Initiative: 15, Accuracy: 17, Guard: 19, Resist: 19, rollBonus: '+7', Speed: 7, DMG: 'd10' },
    { level: 9, HP: 95, Initiative: 16, Accuracy: 18, Guard: 20, Resist: 20, rollBonus: '+8', Speed: 8, DMG: 'd10' },
    { level: 10, HP: 100, Initiative: 16, Accuracy: 18, Guard: 20, Resist: 20, rollBonus: '+8', Speed: 8, DMG: 'd10' },
  ],
  Enforcer: [
    { level: 1, HP: 40, Initiative: 12, Accuracy: 14, Guard: 12, Resist: 14, rollBonus: '+6', Speed: 5, DMG: 'd8' },
    { level: 2, HP: 60, Initiative: 12, Accuracy: 14, Guard: 12, Resist: 14, rollBonus: '+6', Speed: 5, DMG: 'd8' },
    { level: 3, HP: 80, Initiative: 13, Accuracy: 15, Guard: 13, Resist: 15, rollBonus: '+7', Speed: 5, DMG: 'd8' },
    { level: 4, HP: 90, Initiative: 13, Accuracy: 15, Guard: 13, Resist: 15, rollBonus: '+7', Speed: 5, DMG: 'd8' },
    { level: 5, HP: 100, Initiative: 14, Accuracy: 16, Guard: 14, Resist: 16, rollBonus: '+8', Speed: 5, DMG: 'd10' },
    { level: 6, HP: 110, Initiative: 14, Accuracy: 16, Guard: 14, Resist: 16, rollBonus: '+8', Speed: 5, DMG: 'd10' },
    { level: 7, HP: 120, Initiative: 15, Accuracy: 17, Guard: 15, Resist: 17, rollBonus: '+9', Speed: 5, DMG: 'd10' },
    { level: 8, HP: 130, Initiative: 15, Accuracy: 17, Guard: 15, Resist: 17, rollBonus: '+9', Speed: 5, DMG: 'd12' },
    { level: 9, HP: 140, Initiative: 16, Accuracy: 18, Guard: 16, Resist: 18, rollBonus: '+10', Speed: 5, DMG: 'd12' },
    { level: 10, HP: 150, Initiative: 16, Accuracy: 18, Guard: 16, Resist: 18, rollBonus: '+10', Speed: 5, DMG: 'd12' },
  ],
  Guardian: [
    { level: 1, HP: 25, Initiative: 12, Accuracy: 14, Guard: 16, Resist: 14, rollBonus: '+4', Speed: 5, DMG: 'd6' },
    { level: 2, HP: 40, Initiative: 12, Accuracy: 14, Guard: 16, Resist: 14, rollBonus: '+4', Speed: 5, DMG: 'd6' },
    { level: 3, HP: 50, Initiative: 13, Accuracy: 15, Guard: 17, Resist: 15, rollBonus: '+5', Speed: 5, DMG: 'd6' },
    { level: 4, HP: 60, Initiative: 13, Accuracy: 15, Guard: 17, Resist: 15, rollBonus: '+5', Speed: 5, DMG: 'd6' },
    { level: 5, HP: 70, Initiative: 14, Accuracy: 16, Guard: 18, Resist: 16, rollBonus: '+6', Speed: 5, DMG: 'd8' },
    { level: 6, HP: 80, Initiative: 14, Accuracy: 16, Guard: 18, Resist: 16, rollBonus: '+6', Speed: 5, DMG: 'd8' },
    { level: 7, HP: 85, Initiative: 15, Accuracy: 17, Guard: 19, Resist: 17, rollBonus: '+7', Speed: 5, DMG: 'd10' },
    { level: 8, HP: 90, Initiative: 15, Accuracy: 17, Guard: 19, Resist: 17, rollBonus: '+7', Speed: 5, DMG: 'd10' },
    { level: 9, HP: 95, Initiative: 16, Accuracy: 18, Guard: 20, Resist: 18, rollBonus: '+8', Speed: 5, DMG: 'd10' },
    { level: 10, HP: 100, Initiative: 16, Accuracy: 18, Guard: 20, Resist: 18, rollBonus: '+8', Speed: 5, DMG: 'd12' },
  ],
  Harrier: [
    { level: 1, HP: 20, Initiative: 16, Accuracy: 14, Guard: 14, Resist: 12, rollBonus: '+2', Speed: 6, DMG: 'd6' },
    { level: 2, HP: 30, Initiative: 16, Accuracy: 14, Guard: 14, Resist: 12, rollBonus: '+2', Speed: 6, DMG: 'd6' },
    { level: 3, HP: 40, Initiative: 17, Accuracy: 15, Guard: 15, Resist: 13, rollBonus: '+3', Speed: 7, DMG: 'd6' },
    { level: 4, HP: 50, Initiative: 17, Accuracy: 15, Guard: 15, Resist: 13, rollBonus: '+3', Speed: 7, DMG: 'd6' },
    { level: 5, HP: 60, Initiative: 18, Accuracy: 16, Guard: 16, Resist: 14, rollBonus: '+4', Speed: 8, DMG: 'd8' },
    { level: 6, HP: 70, Initiative: 18, Accuracy: 16, Guard: 16, Resist: 14, rollBonus: '+4', Speed: 8, DMG: 'd8' },
    { level: 7, HP: 75, Initiative: 19, Accuracy: 17, Guard: 17, Resist: 15, rollBonus: '+5', Speed: 9, DMG: 'd8' },
    { level: 8, HP: 80, Initiative: 19, Accuracy: 17, Guard: 17, Resist: 15, rollBonus: '+5', Speed: 9, DMG: 'd8' },
    { level: 9, HP: 85, Initiative: 20, Accuracy: 18, Guard: 18, Resist: 16, rollBonus: '+6', Speed: 10, DMG: 'd10' },
    { level: 10, HP: 90, Initiative: 20, Accuracy: 18, Guard: 18, Resist: 16, rollBonus: '+6', Speed: 10, DMG: 'd10' },
  ],
  Hellion: [
    { level: 1, HP: 30, Initiative: 14, Accuracy: 16, Guard: 12, Resist: 14, rollBonus: '+2', Speed: 6, DMG: 'd8' },
    { level: 2, HP: 50, Initiative: 14, Accuracy: 16, Guard: 12, Resist: 14, rollBonus: '+2', Speed: 6, DMG: 'd8' },
    { level: 3, HP: 60, Initiative: 15, Accuracy: 17, Guard: 13, Resist: 15, rollBonus: '+3', Speed: 6, DMG: 'd8' },
    { level: 4, HP: 70, Initiative: 15, Accuracy: 17, Guard: 13, Resist: 15, rollBonus: '+3', Speed: 6, DMG: 'd8' },
    { level: 5, HP: 80, Initiative: 16, Accuracy: 18, Guard: 14, Resist: 16, rollBonus: '+4', Speed: 7, DMG: 'd10' },
    { level: 6, HP: 90, Initiative: 16, Accuracy: 18, Guard: 14, Resist: 16, rollBonus: '+4', Speed: 7, DMG: 'd10' },
    { level: 7, HP: 100, Initiative: 17, Accuracy: 19, Guard: 15, Resist: 17, rollBonus: '+5', Speed: 7, DMG: 'd10' },
    { level: 8, HP: 110, Initiative: 17, Accuracy: 19, Guard: 15, Resist: 17, rollBonus: '+5', Speed: 7, DMG: 'd12' },
    { level: 9, HP: 115, Initiative: 18, Accuracy: 20, Guard: 16, Resist: 18, rollBonus: '+6', Speed: 8, DMG: 'd12' },
    { level: 10, HP: 120, Initiative: 18, Accuracy: 20, Guard: 16, Resist: 18, rollBonus: '+6', Speed: 8, DMG: 'd12' },
  ],
  Stalker: [
    { level: 1, HP: 20, Initiative: 14, Accuracy: 16, Guard: 14, Resist: 12, rollBonus: '+4', Speed: 5, DMG: 'd6' },
    { level: 2, HP: 30, Initiative: 14, Accuracy: 16, Guard: 14, Resist: 12, rollBonus: '+4', Speed: 5, DMG: 'd6' },
    { level: 3, HP: 40, Initiative: 15, Accuracy: 17, Guard: 15, Resist: 13, rollBonus: '+5', Speed: 5, DMG: 'd6' },
    { level: 4, HP: 50, Initiative: 15, Accuracy: 17, Guard: 15, Resist: 13, rollBonus: '+5', Speed: 5, DMG: 'd6' },
    { level: 5, HP: 60, Initiative: 16, Accuracy: 18, Guard: 16, Resist: 14, rollBonus: '+6', Speed: 6, DMG: 'd8' },
    { level: 6, HP: 70, Initiative: 16, Accuracy: 18, Guard: 16, Resist: 14, rollBonus: '+6', Speed: 6, DMG: 'd8' },
    { level: 7, HP: 80, Initiative: 17, Accuracy: 19, Guard: 17, Resist: 15, rollBonus: '+7', Speed: 7, DMG: 'd10' },
    { level: 8, HP: 90, Initiative: 17, Accuracy: 19, Guard: 17, Resist: 15, rollBonus: '+7', Speed: 7, DMG: 'd10' },
    { level: 9, HP: 95, Initiative: 18, Accuracy: 20, Guard: 18, Resist: 16, rollBonus: '+7', Speed: 8, DMG: 'd12' },
    { level: 10, HP: 100, Initiative: 18, Accuracy: 20, Guard: 18, Resist: 16, rollBonus: '+8', Speed: 8, DMG: 'd12' },
  ],
  Sorcerer: [
    { level: 1, HP: 20, Initiative: 12, Accuracy: 16, Guard: 12, Resist: 16, rollBonus: '+4', Speed: 5, DMG: 'd8' },
    { level: 2, HP: 30, Initiative: 12, Accuracy: 16, Guard: 12, Resist: 16, rollBonus: '+4', Speed: 5, DMG: 'd8' },
    { level: 3, HP: 40, Initiative: 13, Accuracy: 17, Guard: 13, Resist: 17, rollBonus: '+5', Speed: 5, DMG: 'd8' },
    { level: 4, HP: 50, Initiative: 13, Accuracy: 17, Guard: 13, Resist: 17, rollBonus: '+5', Speed: 5, DMG: 'd8' },
    { level: 5, HP: 55, Initiative: 14, Accuracy: 18, Guard: 14, Resist: 18, rollBonus: '+6', Speed: 5, DMG: 'd10' },
    { level: 6, HP: 60, Initiative: 14, Accuracy: 18, Guard: 14, Resist: 18, rollBonus: '+6', Speed: 5, DMG: 'd10' },
    { level: 7, HP: 65, Initiative: 15, Accuracy: 19, Guard: 15, Resist: 19, rollBonus: '+7', Speed: 6, DMG: 'd10' },
    { level: 8, HP: 70, Initiative: 15, Accuracy: 19, Guard: 15, Resist: 19, rollBonus: '+7', Speed: 6, DMG: 'd12' },
    { level: 9, HP: 75, Initiative: 16, Accuracy: 20, Guard: 16, Resist: 20, rollBonus: '+8', Speed: 7, DMG: 'd12' },
    { level: 10, HP: 80, Initiative: 16, Accuracy: 20, Guard: 16, Resist: 20, rollBonus: '+8', Speed: 7, DMG: 'd12' },
  ],
};

export const TR_TABLE: Record<CreatureTemplate, number[]> = {
  Normal: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  Underling: [3, 5, 7, 10, 12, 15, 17, 20, 22, 25],
  Paragon: [20, 40, 60, 80, 100, 120, 140, 160, 180, 200],
  Tyrant: [40, 80, 120, 160, 200, 240, 280, 320, 360, 400],
};

const DAMAGE_DICE_TIERS: readonly string[] = ['d4', 'd6', 'd8', 'd10', 'd12'];

export function stepDownDamageDie(die: string): string {
    const currentIndex = DAMAGE_DICE_TIERS.indexOf(die);
    if (currentIndex > 0) {
        return DAMAGE_DICE_TIERS[currentIndex - 1];
    }
    return DAMAGE_DICE_TIERS[0]; // Return the lowest die if it's already the lowest or not found
}

export function getTR(template: CreatureTemplate, level: number): number {
    if (level < 1 || level > 10) {
        return 0;
    }
    return TR_TABLE[template]?.[level - 1] ?? 0;
}

export function getStatsForRoleAndLevel(role: Role, level: number): Omit<CreatureAttributes, 'level'> | null {
  if (!role || level < 1 || level > 10) {
    return null;
  }

  const stats = ROLE_STATS[role]?.[level - 1];

  if (!stats) {
    return null;
  }

  // Convert rollBonus string "+X" to number X
  const rollBonus = parseInt(stats.rollBonus, 10);

  return { ...stats, rollBonus: isNaN(rollBonus) ? 0 : rollBonus };
}
