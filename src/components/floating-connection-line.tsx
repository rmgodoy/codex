
"use client";

import React from 'react';
import { getBezierPath, ConnectionLineComponentProps, Node } from 'reactflow';

function getSimpleNodeIntersection(fromNode: Node, toPoint: {x: number; y: number}) {
    const {
        width: nodeWidth,
        height: nodeHeight,
        positionAbsolute: nodePosition,
    } = fromNode;
    
    if (!nodeWidth || !nodeHeight || !nodePosition) {
        return { x: toPoint.x, y: toPoint.y };
    }

    const nodeCenter = { x: nodePosition.x + nodeWidth / 2, y: nodePosition.y + nodeHeight / 2 };

    const dx = toPoint.x - nodeCenter.x;
    const dy = toPoint.y - nodeCenter.y;

    if (dx === 0 && dy === 0) return nodeCenter;

    const w = nodeWidth / 2;
    const h = nodeHeight / 2;

    if (Math.abs(dy) * w > Math.abs(dx) * h) {
        return {
            x: nodeCenter.x + dx * h / Math.abs(dy),
            y: nodeCenter.y + (dy > 0 ? 1 : -1) * h,
        }
    }
    return {
        x: nodeCenter.x + (dx > 0 ? 1 : -1) * w,
        y: nodeCenter.y + dy * w / Math.abs(dx),
    }
}


const FloatingConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromNode,
  toX,
  toY,
}) => {
  if (!fromNode) {
    return null;
  }
  
  const fromPoint = getSimpleNodeIntersection(fromNode, { x: toX, y: toY });

  const [edgePath] = getBezierPath({
    sourceX: fromPoint.x,
    sourceY: fromPoint.y,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={1.5}
        className="animated"
        d={edgePath}
      />
      <circle
        cx={toX}
        cy={toY}
        fill="hsl(var(--background))"
        stroke="hsl(var(--primary))"
        strokeWidth={1.5}
        r={3}
      />
    </g>
  );
};

export default FloatingConnectionLine;
