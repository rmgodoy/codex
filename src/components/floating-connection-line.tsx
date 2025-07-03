
"use client";

import React from 'react';
import { useStore, getBezierPath } from 'reactflow';
import type { ConnectionLineComponent, Node } from 'reactflow';

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getNodeIntersection(intersectionNode: Node, targetNode: Node) {
    // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-a-rectangle-and-a-line-originating-from-its-center
    const {
      width: intersectionNodeWidth,
      height: intersectionNodeHeight,
      positionAbsolute: intersectionNodePosition,
    } = intersectionNode;
    const targetPosition = targetNode.positionAbsolute;
  
    const w = (intersectionNodeWidth ?? 0) / 2;
    const h = (intersectionNodeHeight ?? 0) / 2;
  
    const x2 = (intersectionNodePosition?.x ?? 0) + w;
    const y2 = (intersectionNodePosition?.y ?? 0) + h;
    const x1 = (targetPosition?.x ?? 0) + (targetNode.width ?? 0) / 2;
    const y1 = (targetPosition?.y ?? 0) + (targetNode.height ?? 0) / 2;
  
    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
    const xx3 = a * xx1;
    const yy3 = a * yy1;
    const x = w * (xx3 + yy3) + x2;
    const y = h * (-xx3 + yy3) + y2;
  
    return { x, y };
}
  
const FloatingConnectionLine: ConnectionLineComponent = ({ fromNode, toX, toY }) => {
  if (!fromNode) {
    return null;
  }

  const targetNode = {
    id: 'target-node',
    width: 1,
    height: 1,
    positionAbsolute: { x: toX, y: toY },
  } as Node;

  const { x, y } = getNodeIntersection(fromNode, targetNode);
  const [edgePath] = getBezierPath({
    sourceX: x,
    sourceY: y,
    sourcePosition: 'bottom', // this is just a placeholder
    targetX: toX,
    targetY: toY,
    targetPosition: 'top', // this is just a placeholder
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
        fill="#fff"
        r={3}
        stroke="hsl(var(--primary))"
        strokeWidth={1.5}
      />
    </g>
  );
};

export default FloatingConnectionLine;
