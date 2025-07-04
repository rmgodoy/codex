
import type { LucideIcon } from 'lucide-react';
import {
  Mountain, Trees, Castle, Tent, HelpCircle, Skull, Warehouse, TowerControl
} from 'lucide-react';
import {
  mountain, trees, castle, tent, helpCircle, skull, warehouse, towerControl as towerControlData
} from 'lucide';

type IconNode = [string, object][];

export const TILE_ICON_COMPONENTS: { [key: string]: LucideIcon } = {
  mountain: Mountain,
  forest: Trees,
  city: Castle,
  camp: Tent,
  dungeon: Warehouse,
  tower: TowerControl,
  lair: Skull,
  poi: HelpCircle,
};

export const TILE_ICON_DATA: { [key: string]: IconNode } = {
  mountain,
  forest: trees,
  city: castle,
  camp: tent,
  dungeon: warehouse,
  tower: towerControlData,
  lair: skull,
  poi: helpCircle,
};

export const TILE_ICON_NAMES = Object.keys(TILE_ICON_COMPONENTS);
