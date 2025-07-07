
'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { pixelToHex, hexToPixel, getHexCorner, getHexNeighbors, type Hex } from '@/lib/hex-utils';
import type { HexTile } from '@/lib/types';

const drawIcon = (ctx: CanvasRenderingContext2D, center: { x: number; y: number }, icon: string, size: number, foregroundColor: string) => {
    const iconSize = size * 0.9;
    const scale = iconSize / 24; // Lucide icons are in a 24x24 viewbox.
    const { x, y } = center;

    ctx.save();
    ctx.translate(x - iconSize / 2, y - iconSize / 2);
    ctx.scale(scale, scale);
    ctx.strokeStyle = foregroundColor;
    ctx.lineWidth = 1.5 / scale; // Keep stroke width consistent

    type IconData = string[] | { paths: string[]; circles: { cx: number; cy: number; r: number }[] };
    let iconData: IconData = [];

    switch (icon) {
        case 'Home':
            iconData = ["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"];
            break;
        case 'Trees':
            iconData = ["M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z", "M7 16v6", "M13 19v3", "M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"];
            break;
        case 'Mountain':
            iconData = ["m8 3 4 8 5-5 5 15H2L8 3z"];
            break;
        case 'Castle':
             iconData = ["M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z", "M18 11V4H6v7", "M15 22v-4a3 3 0 0 0-3-3a3 3 0 0 0-3 3v4", "M22 11V9", "M2 11V9", "M6 4V2", "M18 4V2", "M10 4V2", "M14 4V2"];
            break;
        case 'TowerControl':
            iconData = ["M18.2 12.27 20 6H4l1.8 6.27a1 1 0 0 0 .95.73h10.5a1 1 0 0 0 .96-.73Z","M8 13v9","M16 22v-9","m9 6 1 7","m15 6-1 7","M12 6V2","M13 2h-2"];
            break;
        case 'Tent':
            iconData = ["M3.5 21 14 3","M20.5 21 10 3","M15.5 21 12 15l-3.5 6","M2 21h20"];
            break;
        case 'Waves':
            iconData = ["M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1", "M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1", "M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"];
            break;
        case 'MapPin':
            iconData = ["M12 17v5", "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"];
            break;
        case 'Landmark':
            iconData = ["M10 18v-7", "M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z", "M14 18v-7", "M18 18v-7", "M3 22h18", "M6 18v-7"];
            break;
        case 'Skull':
            iconData = {
                paths: ["m12.5 17-.5-1-.5 1h1z", "M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"],
                circles: [{cx: 15, cy: 12, r: 1}, {cx: 9, cy: 12, r: 1}]
            };
            break;
    }
    
    if (Array.isArray(iconData)) {
        iconData.forEach(pathData => {
            const path = new Path2D(pathData);
            ctx.stroke(path);
        });
    } else { // Handles complex icons with paths and circles
        iconData.paths.forEach(pathData => {
            const path = new Path2D(pathData);
            ctx.stroke(path);
        });
        iconData.circles.forEach(circle => {
            ctx.beginPath();
            ctx.arc(circle.cx, circle.cy, circle.r, 0, 2 * Math.PI);
            ctx.fillStyle = foregroundColor;
            ctx.fill();
        });
    }

    ctx.restore();
};

interface HexGridProps {
  grid: HexTile[];
  hexSize?: number;
  className?: string;
  onGridUpdate: (grid: HexTile[]) => void;
  onHexHover: (hex: Hex | null) => void;
  onHexClick: (hex: Hex | null) => void;
  activeTool: 'settings' | 'paint' | 'data';
  paintMode: 'brush' | 'bucket' | 'erase';
  paintColor: string;
  paintIcon: string | null;
  paintIconColor: string;
  selectedHex: Hex | null;
}

const HexGrid: React.FC<HexGridProps> = ({ grid, hexSize = 25, className, onGridUpdate, onHexHover, onHexClick, activeTool, paintMode, paintColor, paintIcon, paintIconColor, selectedHex }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasSimpleRef = useRef<HTMLCanvasElement | null>(null);
  
  const [themeColors, setThemeColors] = useState({
    background: '#1A0024',
    border: '#4B0082',
    accent: '#8A2BE2',
    foreground: '#E0D6F0',
  });

  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  const [isPainting, setIsPainting] = useState(false);
  const [lastPaintedHex, setLastPaintedHex] = useState<Hex | null>(null);

  const gridMap = useMemo(() => new Map(grid.map(tile => [`${tile.hex.q},${tile.hex.r}`, tile])), [grid]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      setThemeColors({ 
        background: `hsl(${computedStyle.getPropertyValue('--background').trim()})`,
        border: `hsl(${computedStyle.getPropertyValue('--border').trim()})`,
        accent: `hsl(${computedStyle.getPropertyValue('--accent').trim()})`,
        foreground: `hsl(${computedStyle.getPropertyValue('--foreground').trim()})` 
      });
    }
  }, []);

  const getHexFromMouseEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Hex | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - (rect.width / 2 + view.x)) / view.zoom;
      const worldY = (mouseY - (rect.height / 2 + view.y)) / view.zoom;
      
      return pixelToHex(worldX, worldY, hexSize);
  }, [view.x, view.y, view.zoom, hexSize]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = themeColors.background;
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(width / 2 + view.x, height / 2 + view.y);
    ctx.scale(view.zoom, view.zoom);
    
    const LOD_THRESHOLD = 0.4;
    const canvasToDraw = view.zoom > LOD_THRESHOLD ? offscreenCanvasRef.current : offscreenCanvasSimpleRef.current;
    
    if (canvasToDraw) {
        const worldWidth = canvasToDraw.width;
        const worldHeight = canvasToDraw.height;
        if (worldWidth > 0 && worldHeight > 0) {
            ctx.drawImage(canvasToDraw, -worldWidth / 2, -worldHeight / 2);
        }
    }
    
    // Draw dynamic elements on top
    const currentHoveredHex = getHexFromMouseEvent({ clientX: lastPanPoint.x, clientY: lastPanPoint.y } as React.MouseEvent<HTMLCanvasElement>);

    if (activeTool === 'paint' && currentHoveredHex) {
        const center = hexToPixel(currentHoveredHex, hexSize);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const corner = getHexCorner(center, hexSize, i);
            if (i === 0) ctx.moveTo(corner.x, corner.y); else ctx.lineTo(corner.x, corner.y);
        }
        ctx.closePath();
        ctx.fillStyle = themeColors.accent;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    if (selectedHex) {
        const center = hexToPixel(selectedHex, hexSize);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const corner = getHexCorner(center, hexSize, i);
            if (i === 0) ctx.moveTo(corner.x, corner.y); else ctx.lineTo(corner.x, corner.y);
        }
        ctx.closePath();
        ctx.strokeStyle = themeColors.accent;
        ctx.lineWidth = 3 / view.zoom;
        ctx.stroke();
    }
    
    ctx.restore();

  }, [getHexFromMouseEvent, hexSize, themeColors, view, lastPanPoint, selectedHex, activeTool]);


  // Effect for drawing the entire static grid to offscreen canvases
  useEffect(() => {
      if (!grid.length || !canvasRef.current) return;
      
      const maxRadius = grid.reduce((max, tile) => Math.max(max, Math.abs(tile.hex.q), Math.abs(tile.hex.r), Math.abs(tile.hex.s)), 0);
      if (isNaN(maxRadius) || maxRadius <= 0) return;

      const worldWidth = maxRadius * hexSize * 3 + hexSize * 2;
      const worldHeight = maxRadius * hexSize * Math.sqrt(3) * 2 + hexSize * 2;

      // --- Detailed Canvas ---
      if (!offscreenCanvasRef.current) offscreenCanvasRef.current = document.createElement('canvas');
      const offscreenCanvas = offscreenCanvasRef.current;
      offscreenCanvas.width = worldWidth;
      offscreenCanvas.height = worldHeight;
      const offscreenCtx = offscreenCanvas.getContext('2d');

      // --- Simple Canvas ---
      if (!offscreenCanvasSimpleRef.current) offscreenCanvasSimpleRef.current = document.createElement('canvas');
      const offscreenSimpleCanvas = offscreenCanvasSimpleRef.current;
      offscreenSimpleCanvas.width = worldWidth;
      offscreenSimpleCanvas.height = worldHeight;
      const offscreenSimpleCtx = offscreenSimpleCanvas.getContext('2d');
      
      if (!offscreenCtx || !offscreenSimpleCtx) return;

      offscreenCtx.translate(worldWidth / 2, worldHeight / 2);
      offscreenSimpleCtx.translate(worldWidth / 2, worldHeight / 2);

      grid.forEach(tile => {
          const { hex, data } = tile;
          const center = hexToPixel(hex, hexSize);

          const hexPath = new Path2D();
          for (let i = 0; i < 6; i++) {
              const corner = getHexCorner(center, hexSize, i);
              if (i === 0) hexPath.moveTo(corner.x, corner.y); else hexPath.lineTo(corner.x, corner.y);
          }
          hexPath.closePath();
          
          // Draw on Detailed Canvas
          offscreenCtx.strokeStyle = themeColors.border;
          offscreenCtx.lineWidth = 1;
          offscreenCtx.fillStyle = data.color || themeColors.background;
          offscreenCtx.fill(hexPath);
          offscreenCtx.stroke(hexPath);
          if (data.icon) {
              drawIcon(offscreenCtx, center, data.icon, hexSize, data.iconColor || themeColors.foreground);
          }

          // Draw on Simple Canvas
          offscreenSimpleCtx.fillStyle = data.color || themeColors.background;
          offscreenSimpleCtx.fill(hexPath);
      });

      draw();
  }, [grid, hexSize, themeColors, draw]);


  useEffect(() => {
    draw();
  }, [draw]);

  const bucketFill = useCallback((startHex: Hex) => {
    const startTile = gridMap.get(`${startHex.q},${startHex.r}`);
    if (!startTile) return;

    const originalColor = startTile.data.color;
    const originalIcon = startTile.data.icon;

    if (originalColor === paintColor && originalIcon === paintIcon) return;

    const tilesToPaint = new Set<string>();
    const queue: Hex[] = [startHex];
    const visited = new Set<string>([`${startHex.q},${startHex.r}`]);
    
    tilesToPaint.add(`${startHex.q},${startHex.r}`);

    while (queue.length > 0) {
        const currentHex = queue.shift()!;
        const neighbors = getHexNeighbors(currentHex);

        for (const neighborHex of neighbors) {
            const neighborKey = `${neighborHex.q},${neighborHex.r}`;
            if (!visited.has(neighborKey)) {
                visited.add(neighborKey);
                const neighborTile = gridMap.get(neighborKey);

                if (neighborTile && neighborTile.data.color === originalColor && neighborTile.data.icon === originalIcon) {
                    tilesToPaint.add(neighborKey);
                    queue.push(neighborHex);
                }
            }
        }
    }

    if (tilesToPaint.size > 0) {
        const newGrid = grid.map(tile => {
            if (tilesToPaint.has(`${tile.hex.q},${tile.hex.r}`)) {
                return { ...tile, data: { ...tile.data, color: paintColor, icon: paintIcon, iconColor: paintIconColor } };
            }
            return tile;
        });
        onGridUpdate(newGrid);
    }
  }, [grid, gridMap, paintColor, paintIcon, paintIconColor, onGridUpdate]);
  
  const paintTile = useCallback((hex: Hex) => {
    const newGrid = grid.map(tile => {
        if (tile.hex.q === hex.q && tile.hex.r === hex.r) {
            if (paintMode === 'erase') {
                return { ...tile, data: { ...tile.data, color: undefined, icon: undefined, iconColor: undefined } };
            }
            return { ...tile, data: { ...tile.data, color: paintColor, icon: paintIcon, iconColor: paintIconColor } };
        }
        return tile;
    });
    onGridUpdate(newGrid);
  }, [grid, paintColor, paintIcon, paintIconColor, onGridUpdate, paintMode]);


  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const clickedHex = getHexFromMouseEvent(e);

    if (activeTool === 'paint') {
      if (clickedHex) {
        if (paintMode === 'brush' || paintMode === 'erase') {
          setIsPainting(true);
          paintTile(clickedHex);
          setLastPaintedHex(clickedHex);
        } else if (paintMode === 'bucket') {
          bucketFill(clickedHex);
        }
      }
    } else {
      if(clickedHex) onHexClick(clickedHex);
    }
    
    if (e.button === 2) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [getHexFromMouseEvent, onHexClick, paintMode, paintTile, bucketFill, activeTool]);

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { setIsPainting(false); setLastPaintedHex(null); }
    if (e.button === 2) { setIsPanning(false); }
  };
  
  const handleMouseLeave = () => {
    setIsPanning(false); setIsPainting(false); setLastPaintedHex(null); onHexHover(null);
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setLastPanPoint({ x: e.clientX, y: e.clientY }); // For hover redraw
    
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      return;
    }
    
    const currentHex = getHexFromMouseEvent(e);
    onHexHover(currentHex);

    if (activeTool === 'paint' && (paintMode === 'brush' || paintMode === 'erase') && isPainting) {
        if (currentHex) {
            if (!lastPaintedHex || (currentHex.q !== lastPaintedHex.q || currentHex.r !== lastPaintedHex.r)) {
                paintTile(currentHex);
                setLastPaintedHex(currentHex);
            }
        }
    }
  }, [isPanning, lastPanPoint, getHexFromMouseEvent, paintMode, isPainting, paintTile, onHexHover, activeTool]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 ? view.zoom * zoomFactor : view.zoom / zoomFactor;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - (rect.width / 2 + view.x)) / view.zoom;
    const worldY = (mouseY - (rect.height / 2 + view.y)) / view.zoom;
    
    const newX = mouseX - worldX * newZoom - rect.width / 2;
    const newY = mouseY - worldY * newZoom - rect.height / 2;

    setView({
      x: newX,
      y: newY,
      zoom: Math.max(0.1, Math.min(5, newZoom)),
    });
  };

  return <canvas 
            ref={canvasRef} 
            className={className} 
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
        />;
};

export default HexGrid;

    