
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
  const iconCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const [isCacheReady, setIsCacheReady] = useState(false);

  // Effect to pre-render icons to offscreen canvases for performance
  useEffect(() => {
    const renderIconsToCache = () => {
        if (typeof window === 'undefined') return;

        const color = getComputedStyle(document.documentElement).getPropertyValue('--card-foreground').trim();
        const iconColor = `hsl(${color})`;
        const cache = new Map<string, HTMLCanvasElement>();
        
        // Use a slightly larger size for the source canvas for better quality when scaled down
        const sourceIconSize = hexSize * 2;

        for (const iconName in TILE_ICON_DATA) {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = sourceIconSize;
            offscreenCanvas.height = sourceIconSize;
            const ctx = offscreenCanvas.getContext('2d');

            if (ctx) {
                const iconNode = TILE_ICON_DATA[iconName as keyof typeof TILE_ICON_DATA];
                
                if (!Array.isArray(iconNode)) {
                    console.warn(`Icon data for "${iconName}" is not iterable. Skipping.`);
                    continue;
                }

                ctx.strokeStyle = iconColor;
                ctx.lineWidth = 2.5; // A fixed stroke width for the cached image
                ctx.translate(sourceIconSize / 2, sourceIconSize / 2);
                
                const scale = (sourceIconSize * 0.7) / 24;
                ctx.scale(scale, scale);
                ctx.translate(-12, -12);
                
                for (const node of iconNode) {
                    const [tag, attrs] = node;
                    if (tag === 'path' && attrs.d) {
                        const p = new Path2D(attrs.d as string);
                        ctx.stroke(p);
                    } else if (tag === 'circle' && attrs.cx !== undefined) {
                        ctx.beginPath();
                        ctx.arc(Number(attrs.cx), Number(attrs.cy), Number(attrs.r), 0, 2 * Math.PI);
                        ctx.stroke();
                    } else if (tag === 'rect' && attrs.x !== undefined) {
                        ctx.strokeRect(Number(attrs.x), Number(attrs.y), Number(attrs.width), Number(attrs.height));
                    }
                }
                cache.set(iconName, offscreenCanvas);
            }
        }
        iconCache.current = cache;
        setIsCacheReady(true);
    };
    
    // We need a short delay to ensure CSS variables are available on first load.
    const timeoutId = setTimeout(renderIconsToCache, 50);

    return () => clearTimeout(timeoutId);
  }, [hexSize]);

  const draw = useCallback(() => {
    if (!isCacheReady) return;
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
            ctx.lineWidth = tile.id === selectedTileId ? (3 / zoom) : (1 / zoom);
            ctx.stroke();

            // Draw the icon from the pre-rendered cache
            if (tile.icon) {
                const cachedIcon = iconCache.current.get(tile.icon);
                if (cachedIcon) {
                    const iconDrawSize = hexSize * 0.9;
                    ctx.drawImage(
                        cachedIcon,
                        x - iconDrawSize / 2,
                        y - iconDrawSize / 2,
                        iconDrawSize,
                        iconDrawSize
                    );
                }
            }
        }
    }

    ctx.restore();
  }, [viewport, width, height, map.tiles, selectedTileId, hexSize, isCacheReady]);

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
