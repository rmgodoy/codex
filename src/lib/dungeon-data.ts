
import type { DungeonHostilityLevel, DungeonSize } from './types';

export const DUNGEON_HOSTILITY: Record<DungeonHostilityLevel, { name: string; targetNumber: number; threatRating: string; threatRange: string }> = {
    'I': { name: 'Bleak', targetNumber: 10, threatRating: '2d6 x 10', threatRange: '20 to 120' },
    'II': { name: 'Sinister', targetNumber: 12, threatRating: '2d6 x 20', threatRange: '40 to 240' },
    'III': { name: 'Frightening', targetNumber: 15, threatRating: '2d6 x 30', threatRange: '60 to 360' },
    'IV': { name: 'Harrowing', targetNumber: 18, threatRating: '2d6 x 40', threatRange: '80 to 480' },
    'V': { name: 'Nightmarish', targetNumber: 20, threatRating: '2d6 x 50', threatRange: '100 to 600' },
};

export const DUNGEON_SIZE: Record<DungeonSize, { rooms: string; treasureRoll: string }> = {
    'Tiny': { rooms: '2D4 (~5)', treasureRoll: '2D6 X HOSTILITY' },
    'Small': { rooms: '4D4 (~10)', treasureRoll: '4D6 X HOSTILITY' },
    'Medium': { rooms: '6D4 (~15)', treasureRoll: '6D6 X HOSTILITY' },
    'Large': { rooms: '8D4 (~20)', treasureRoll: '8D6 X HOSTILITY' },
    'Huge': { rooms: '10D4 (~25)', treasureRoll: '10D6 X HOSTILITY' },
};

export const HOSTILITY_LEVELS = Object.keys(DUNGEON_HOSTILITY) as DungeonHostilityLevel[];
export const SIZE_LEVELS = Object.keys(DUNGEON_SIZE) as DungeonSize[];
