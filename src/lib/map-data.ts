
import type { LucideIcon } from 'lucide-react';
import { Mountain, Trees, Castle, Tent, HelpCircle, Skull, Warehouse, TowerControl } from 'lucide-react';

export const TILE_ICONS: { [key: string]: LucideIcon } = {
  mountain: Mountain,
  forest: Trees,
  city: Castle,
  camp: Tent,
  dungeon: Warehouse,
  tower: TowerControl,
  lair: Skull,
  poi: HelpCircle,
};

export const TILE_ICON_NAMES = Object.keys(TILE_ICONS);
