'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const handleStyle: React.CSSProperties = {
  visibility: 'hidden',
};

export function DungeonRoomNode({ data }: NodeProps<{ label: string }>) {
  return (
    <>
      {/* We need handles for the floating edges to work, but they should be invisible. */}
      <Handle type="source" position={Position.Top} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <Handle type="source" position={Position.Left} style={handleStyle} />
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <Handle type="target" position={Position.Right} style={handleStyle} />
      <Handle type="target" position={Position.Bottom} style={handleStyle} />
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div className="w-full h-full flex items-center justify-center text-center p-2">
        {data.label}
      </div>
    </>
  );
}
