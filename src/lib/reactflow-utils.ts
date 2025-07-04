
"use client";

import type { Node } from 'reactflow';

// Returns the intersection point of the line between the center of the two nodes and the border of the rectangle
function getNodeIntersection(intersectionNode: Node, targetNode: Node): { x: number; y: number } {
    if (
        !intersectionNode.width ||
        !intersectionNode.height ||
        !intersectionNode.positionAbsolute ||
        !targetNode.width ||
        !targetNode.height ||
        !targetNode.positionAbsolute
    ) {
        return { x: 0, y: 0 };
    }

    const {
        width: intersectionNodeWidth,
        height: intersectionNodeHeight,
        positionAbsolute: intersectionNodePosition,
    } = intersectionNode;

    const targetPosition = targetNode.positionAbsolute;

    const w = intersectionNodeWidth / 2;
    const h = intersectionNodeHeight / 2;

    const x2 = intersectionNodePosition.x + w;
    const y2 = intersectionNodePosition.y + h;
    const x1 = targetPosition.x + targetNode.width / 2;
    const y1 = targetPosition.y + targetNode.height / 2;

    const dx = x1 - x2;
    const dy = y1 - y2;

    if (dx === 0 && dy === 0) {
        return { x: x2, y: y2 };
    }

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let x, y;

    if (absDx / w > absDy / h) {
        // Intersects with left or right side
        x = x2 + (dx > 0 ? 1 : -1) * w;
        y = y2 + dy * (w / absDx);
    } else {
        // Intersects with top or bottom side
        y = y2 + (dy > 0 ? 1 : -1) * h;
        x = x2 + dx * (h / absDy);
    }

    return { x, y };
}

// Returns the parameters (sx, sy, tx, ty) for a floating edge
export function getEdgeParams(source: Node, target: Node) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
  };
}
