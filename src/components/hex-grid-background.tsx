
"use client";

import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { MapData } from '@/lib/types';
import { TILE_ICON_DATA } from '@/lib/map-data';

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
  const [iconColor, setIconColor] = useState('#FFFFFF'); // Default to white

  useEffect(() => {
    // This effect runs on the client-side, where we can access computed styles
    if (typeof window !== 'undefined') {
        const color = getComputedStyle(document.documentElement).getPropertyValue('--card-foreground').trim();
        // The color is in HSL format like "275 40% 90%". Canvas wants "hsl(275, 40%, 90%)".
        setIconColor(`hsl(${color})`);
    }
  }, []);

  
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

            if (tile.icon && TILE_ICON_DATA[tile.icon]) {
                ctx.strokeStyle = iconColor;
                
                const IconKey = tile.icon as keyof typeof TILE_ICON_DATA;
                const iconNode = TILE_ICON_DATA[IconKey];

                if (iconNode) {
                   ctx.save();
                   ctx.translate(x, y);
                   
                   const iconSize = hexSize * 0.7;
                   const iconScale = iconSize / 24;
                   ctx.scale(iconScale, iconScale);
                   ctx.translate(-12, -12);
                   
                   ctx.lineWidth = 1.5;

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
  }, [viewport, width, height, map.tiles, selectedTileId, hexSize, iconColor]);

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
