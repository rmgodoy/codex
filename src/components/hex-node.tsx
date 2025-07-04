
'use client';

import React from 'react';
import { Handle, Position, NodeProps, Node } from 'reactflow';
import { TILE_ICON_COMPONENTS } from '@/lib/map-data';
import { cn } from '@/lib/utils';

// Hexagon points for a pointy-top hexagon, to match the layout algorithm
const points = "0,-1 0.866,-0.5 0.866,0.5 0,1 -0.866,0.5 -0.866,-0.5";

type HexNodeData = {
  color?: string;
  icon?: string;
  width: number;
  height: number;
  onMouseDown: (event: React.MouseEvent, node: Node) => void;
  onMouseEnter: (event: React.MouseEvent, node: Node) => void;
};

export function HexNode({ data, selected, id, ...rest }: NodeProps<HexNodeData>) {
  const Icon = data.icon ? TILE_ICON_COMPONENTS[data.icon as keyof typeof TILE_ICON_COMPONENTS] : null;

  const onMouseDown = (event: React.MouseEvent) => {
    // Construct a node object to pass back to the handler
    const node = { id, data, selected, ...rest } as Node;
    if (data.onMouseDown) {
      data.onMouseDown(event, node);
    }
  };
  
  const onMouseEnter = (event: React.MouseEvent) => {
    const node = { id, data, selected, ...rest } as Node;
    if (data.onMouseEnter) {
      data.onMouseEnter(event, node);
    }
  };

  return (
    <>
      <div 
        className="relative"
        style={{ width: data.width, height: data.height }}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
      >
        <svg
          viewBox="-0.866 -1 1.732 2"
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
          className="drop-shadow-md"
        >
          <polygon 
            points={points} 
            fill={data.color || 'hsl(var(--muted))'} 
            stroke={selected ? 'hsl(var(--ring))' : 'hsl(var(--border))'} 
            strokeWidth={selected ? 0.08 : 0.04} 
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
