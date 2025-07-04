
'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TILE_ICON_COMPONENTS } from '@/lib/map-data';
import { cn } from '@/lib/utils';

// Hexagon points for a pointy-top hexagon, to match the layout algorithm
const points = "0,-1 0.866,-0.5 0.866,0.5 0,1 -0.866,0.5 -0.866,-0.5";

export function HexNode({ data, selected }: NodeProps<{ color?: string; icon?: string; width: number; height: number }>) {
  const Icon = data.icon ? TILE_ICON_COMPONENTS[data.icon as keyof typeof TILE_ICON_COMPONENTS] : null;

  return (
    <>
      <div 
        className="relative"
        style={{ width: data.width, height: data.height }}
      >
        <svg
          viewBox="-1.1 -1.1 2.2 2.2"
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
          className="drop-shadow-md"
        >
          <polygon 
            points={points} 
            fill={data.color || 'hsl(var(--muted))'} 
            stroke={selected ? 'hsl(var(--ring))' : 'hsl(var(--border))'} 
            strokeWidth={selected ? 0.10 : 0.05} 
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
            {Icon && <Icon color="#000000" size={data.width * 0.4} />}
        </div>
      </div>
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Left} style={{ visibility: 'hidden' }} />
    </>
  );
}
