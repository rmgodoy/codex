
"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const DungeonRoomNode = ({ data, isConnectable, selected }: NodeProps<{ label: string }>) => {
  return (
    <Card className={cn("w-[150px] h-[80px]", selected && "ring-2 ring-primary")}>
      <CardHeader className="p-2 h-full flex items-center justify-center">
        <CardTitle className="text-sm text-center font-semibold leading-tight">{data.label}</CardTitle>
      </CardHeader>
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
        className="!bg-primary opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        className="!bg-primary opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        className="!bg-primary opacity-0"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        className="!bg-primary opacity-0"
      />
    </Card>
  );
};

export default memo(DungeonRoomNode);

