
"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useReactFlow, useStore } from 'reactflow';
import type { MapData } from '@/lib/types';
import { TILE_ICONS } from '@/lib/map-data';

// Conversion from axial coordinates (q, r) to pixel coordinates (x, y) for pointy-top hexagons
function axialToPixel(q: number, r: number, size: number) {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * 3 / 2 * r;
  return { x, y };
}

export const HexGridBackground = ({ map, selectedTileId, hexSize }: { map: MapData; selectedTileId: string | null, hexSize: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getViewport } = useReactFlow();
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: viewX, y: viewY, zoom } = getViewport();
    
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
            
            ctx.fillStyle = tile.id === selectedTileId ? 'hsl(var(--ring))' : (tile.color || '#9CA3AF');
            ctx.fill();
            ctx.strokeStyle = 'hsl(var(--border))';
            ctx.lineWidth = 2 / zoom;
            ctx.stroke();

            if (tile.icon && TILE_ICONS[tile.icon]) {
                ctx.fillStyle = 'hsl(var(--card-foreground))';
                ctx.font = `${hexSize * 0.5}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(tile.icon.charAt(0).toUpperCase(), x, y);
            }
        }
    }

    ctx.restore();
  }, [getViewport, width, height, map.tiles, selectedTileId, hexSize]);

  useEffect(() => {
    draw();
  }, [draw, map, selectedTileId, width, height]);

  return (
    <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="absolute top-0 left-0"
        style={{ pointerEvents: 'none' }}
    />
  );
};
