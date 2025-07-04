
import type { LucideIcon } from 'lucide-react';
import {
  Mountain, Trees, Castle, Tent, HelpCircle, Skull, Warehouse, TowerControl, Palmtree, Ship, Waves
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
  palm: Palmtree,
  ship: Ship,
  water: Waves,
};

export const TILE_ICON_NAMES = Object.keys(TILE_ICON_COMPONENTS);

export const getIconSVG = (iconName: string, color: string): string => {
  const IconComponent = TILE_ICON_COMPONENTS[iconName as keyof typeof TILE_ICON_COMPONENTS];
  if (!IconComponent || !(IconComponent as any).iconNode) return '';
  
  const iconNode = (IconComponent as any).iconNode;
  
  const renderNode = (node: [string, object]): string => {
    const [tag, attrs] = node;
    const attrString = Object.entries(attrs).map(([key, val]) => `${key}="${val}"`).join(' ');
    return `<${tag} ${attrString} />`;
  }
  
  const children = iconNode.map(renderNode).join('');
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
};
