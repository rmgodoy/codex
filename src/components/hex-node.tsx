
'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TILE_ICON_COMPONENTS } from '@/lib/map-data';
import { cn } from '@/lib/utils';

// Hexagon points for a flat-top hexagon
const points = "1,0 0.5,-0.866 -0.5,-0.866 -1,0 -0.5,0.866 0.5,0.866";

export function HexNode({ data, selected }: NodeProps<{ color?: string; icon?: string; width: number; height: number }>) {
  const Icon = data.icon ? TILE_ICON_COMPONENTS[data.icon as keyof typeof TILE_ICON_COMPONENTS] : null;

  return (
    <>
      <div className={cn("relative", selected && "z-10")}>
        <svg
          viewBox="-1.1 -1.1 2.2 2.2"
          width={data.width}
          height={data.height}
          style={{ overflow: 'visible' }}
          className="drop-shadow-md"
        >
          <polygon 
            points={points} 
            fill={data.color || 'hsl(var(--muted))'} 
            stroke={selected ? 'hsl(var(--ring))' : 'hsl(var(--border))'} 
            strokeWidth={selected ? 0.15 : 0.05} 
          />
          {Icon && <Icon color="hsl(var(--card-foreground))" size={1} transform="scale(0.8) translate(-0.5, 0.5) scale(1, -1)" />}
        </svg>
      </div>
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Left} style={{ visibility: 'hidden' }} />
    </>
  );
}
