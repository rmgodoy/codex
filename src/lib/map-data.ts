
import type { LucideIcon } from 'lucide-react';
import {
  Mountain, Trees, Castle, Tent, HelpCircle, Skull, Warehouse, TowerControl
} from 'lucide-react';

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
  mountain: (Mountain as any).iconNode,
  forest: (Trees as any).iconNode,
  city: (Castle as any).iconNode,
  camp: (Tent as any).iconNode,
  dungeon: (Warehouse as any).iconNode,
  tower: (TowerControl as any).iconNode,
  lair: (Skull as any).iconNode,
  poi: (HelpCircle as any).iconNode,
};

export const TILE_ICON_NAMES = Object.keys(TILE_ICON_COMPONENTS);
