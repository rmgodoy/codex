'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TILE_ICON_COMPONENTS } from '@/lib/map-data';
import { cn } from '@/lib/utils';

const points = "30,1 60,16 60,46 30,61 0,46 0,16";

export function HexNode({ data, selected }: NodeProps<{ color?: string; icon?: string; width: number; height: number }>) {
  const Icon = data.icon ? TILE_ICON_COMPONENTS[data.icon as keyof typeof TILE_ICON_COMPONENTS] : null;

  return (
    <>
      <div className={cn("relative hex-node", selected && "z-10")} style={{ width: data.width, height: data.height }}>
        <svg
          viewBox="0 0 60 62"
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
          className="drop-shadow-md"
        >
          <polygon 
            points={points} 
            fill={data.color || 'hsl(var(--muted))'} 
            stroke={selected ? 'hsl(var(--ring))' : 'hsl(var(--border))'} 
            strokeWidth={selected ? 4 : 2}
          />
          {Icon && <Icon color="hsl(var(--card-foreground))" size={30} x={15} y={16} />}
        </svg>
      </div>
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Left} style={{ visibility: 'hidden' }} />
    </>
  );
}
