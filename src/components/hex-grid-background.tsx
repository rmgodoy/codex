
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
                ctx.fillStyle = 'hsl(var(--card-foreground))';
                ctx.font = `bold ${hexSize * 0.7}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const IconKey = tile.icon as keyof typeof TILE_ICONS;
                // A bit of a hack to render Lucide icons on canvas.
                // This will vary by icon. A more robust solution might use SVGs.
                const iconPath = (TILE_ICONS[IconKey] as any)?.render().props.children[0].props.d;
                if (iconPath) {
                   const p = new Path2D(iconPath);
                   ctx.save();
                   ctx.translate(x, y);
                   const scale = (hexSize * 0.025) / zoom;
                   ctx.scale(scale, scale);
                   ctx.translate(-12, -12); // Center the 24x24 icon
                   ctx.stroke(p);
                   ctx.fill(p);
                   ctx.restore();
                } else {
                   ctx.fillText(tile.icon.charAt(0).toUpperCase(), x, y);
                }
            }
        }
    }

    ctx.restore();
  }, [viewport, width, height, map.tiles, selectedTileId, hexSize]);

  useEffect(() => {
    draw();
  }, [draw, map, selectedTileId, width, height, viewport]);

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
