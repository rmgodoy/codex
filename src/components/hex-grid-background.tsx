
"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import type { MapData } from '@/lib/types';
import { TILE_ICONS } from '@/lib/map-data';

// Conversion from axial coordinates (q, r) to pixel coordinates (pointy-top hexagons)
function axialToPixel(q: number, r: number, size: number) {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * 3 / 2 * r;
  return { x, y };
}

interface HexGridBackgroundProps {
  map: MapData;
  selectedTileId: string | null;
  hexSize: number;
  viewport: { x: number; y: number; scale: number };
  width: number;
  height: number;
}

export const HexGridBackground = ({ map, selectedTileId, hexSize, viewport, width, height }: HexGridBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: viewX, y: viewY, scale: zoom } = viewport;
    
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(viewX, viewY);
    ctx.scale(zoom, zoom);

    if (map.tiles) {
        for (const tile of map.tiles) {
            const { x, y } = axialToPixel(tile.q, tile.r, hexSize);

            const tileWidth = hexSize * Math.sqrt(3);
            const tileHeight = hexSize * 2;
            if (
                x < -viewX / zoom - tileWidth || x > (-viewX + width) / zoom ||
                y < -viewY / zoom - tileHeight || y > (-viewY + height) / zoom
            ) {
                continue;
            }

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = 2 * Math.PI / 6 * (i + 0.5);
                const px = x + hexSize * Math.cos(angle);
                const py = y + hexSize * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            
            ctx.fillStyle = tile.color || '#cccccc';
            ctx.fill();
            ctx.strokeStyle = tile.id === selectedTileId ? 'hsl(var(--ring))' : 'hsl(var(--border))';
            ctx.lineWidth = tile.id === selectedTileId ? (4 / zoom) : (2 / zoom);
            ctx.stroke();

            if (tile.icon && TILE_ICONS[tile.icon]) {
                ctx.strokeStyle = 'hsl(var(--card-foreground))';
                
                const IconKey = tile.icon as keyof typeof TILE_ICONS;
                const iconComponent = TILE_ICONS[IconKey];
                const iconNode = (iconComponent as any)?.iconNode;

                if (iconNode) {
                   ctx.save();
                   ctx.translate(x, y); // translate to center of hex
                   
                   const iconSize = hexSize * 0.7; // Desired icon size
                   const scale = iconSize / 24; // Lucide icons are 24x24
                   ctx.scale(scale, scale);
                   ctx.translate(-12, -12); // Center the 24x24 icon

                   // The original icon has stroke-width="2".
                   // We set the line width relative to the new scale to maintain its visual weight.
                   ctx.lineWidth = 2;

                   for (const node of iconNode) {
                       const [tag, attrs] = node;
                       if (tag === 'path' && attrs.d) {
                           const p = new Path2D(attrs.d);
                           ctx.stroke(p);
                       } else if (tag === 'circle' && attrs.cx !== undefined) {
                           ctx.beginPath();
                           ctx.arc(Number(attrs.cx), Number(attrs.cy), Number(attrs.r), 0, 2 * Math.PI);
                           ctx.stroke();
                       } else if (tag === 'rect' && attrs.x !== undefined) {
                           ctx.strokeRect(Number(attrs.x), Number(attrs.y), Number(attrs.width), Number(attrs.height));
                       }
                   }
                   ctx.restore();
                }
            }
        }
    }

    ctx.restore();
  }, [viewport, width, height, map.tiles, selectedTileId, hexSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="absolute top-0 left-0"
        style={{ pointerEvents: 'none', zIndex: 0 }}
    />
  );
};
