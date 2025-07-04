
"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useReactFlow, useStore } from 'reactflow';
import type { MapData, HexTile } from '@/lib/types';
import { TILE_ICONS } from '@/lib/map-data';

const hexWidth = 100;
const hexHeight = 86.6;
const hexRadius = hexWidth / 2;

// Conversion from axial coordinates (q, r) to pixel coordinates (x, y)
function axialToPixel(q: number, r: number) {
  const x = hexWidth * (3 / 4 * q);
  const y = hexHeight * (r + q / 2);
  return { x, y };
}

// Conversion from pixel coordinates (x, y) to fractional axial coordinates
function pixelToAxial(x: number, y: number) {
    const q = (x * 4 / 3) / hexWidth;
    const r = (-x / 3 + Math.sqrt(3) / 3 * y) / (hexHeight / Math.sqrt(3));
    return { q, r };
}

// Rounding fractional hex coordinates to the nearest integer hex coordinates
function hexRound(q: number, r: number): { q: number; r: number } {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const q_diff = Math.abs(rq - q);
    const r_diff = Math.abs(rr - r);
    const s_diff = Math.abs(rs - s);

    if (q_diff > r_diff && q_diff > s_diff) {
        rq = -rr - rs;
    } else if (r_diff > s_diff) {
        rr = -rq - rs;
    } else {
        rs = -rq - rr;
    }
    return { q: rq, r: rr };
}

export const HexGridBackground = ({ map, onSelectTile, selectedTileId }: { map: MapData; onSelectTile: (id: string | null) => void; selectedTileId: string | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getViewport, screenToFlowPosition } = useReactFlow();
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

    for (const tile of map.tiles) {
        const { x, y } = axialToPixel(tile.q, tile.r);

        // Basic culling (a more precise calculation could be done)
        if (
            x < -hexWidth || x > (-viewX / zoom + width / zoom + hexWidth) ||
            y < -hexHeight || y > (-viewY / zoom + height / zoom + hexHeight)
        ) {
            continue;
        }

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * (i + 0.5);
            const px = x + hexRadius * Math.cos(angle);
            const py = y + hexRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        ctx.fillStyle = tile.id === selectedTileId ? 'hsl(var(--ring))' : (tile.color || 'hsl(var(--muted))');
        ctx.fill();
        ctx.strokeStyle = 'hsl(var(--border))';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (tile.icon && TILE_ICONS[tile.icon]) {
            // This part is tricky with canvas. For simplicity, we'll draw a simple shape.
            // Drawing complex SVG paths requires more code.
            const Icon = TILE_ICONS[tile.icon];
            // A simple representation. For real icons, you'd need to draw their paths.
            ctx.fillStyle = 'hsl(var(--card-foreground))';
            ctx.font = `${hexRadius * 0.6}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile.icon.charAt(0).toUpperCase(), x, y);
        }
    }

    ctx.restore();
  }, [getViewport, width, height, map.tiles, selectedTileId]);

  useEffect(() => {
    draw();
  }, [draw, map, selectedTileId, width, height]);
  
  const handleClick = (event: React.MouseEvent) => {
    const { x, y } = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const { q, r } = pixelToAxial(x, y);
    const rounded = hexRound(q, r);
    const s = -rounded.q - rounded.r;
    const tileId = `${rounded.q},${rounded.r},${s}`;

    const clickedTile = map.tiles.find(t => t.id === tileId);
    if (clickedTile) {
        onSelectTile(tileId);
    } else {
        onSelectTile(null);
    }
  };

  return (
    <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="w-full h-full"
        onClick={handleClick} 
    />
  );
};
