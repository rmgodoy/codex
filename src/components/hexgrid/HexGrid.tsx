
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { pixelToHex, hexToPixel, getHexCorner, type Hex } from '@/lib/hex-utils';
import type { HexTile } from '@/lib/types';
import { Home, Trees, Mountain, Castle, TowerControl } from 'lucide-react';

interface HexGridProps {
  grid: HexTile[];
  hexSize?: number;
  className?: string;
  onHexClick?: (hex: Hex) => void;
}

const drawIcon = (ctx: CanvasRenderingContext2D, center: { x: number; y: number }, icon: string, size: number, foregroundColor: string) => {
    const iconSize = size * 0.9;
    const scale = iconSize / 24; // Lucide icons are in a 24x24 viewbox.
    const { x, y } = center;

    ctx.save();
    ctx.translate(x - iconSize / 2, y - iconSize / 2);
    ctx.scale(scale, scale);
    ctx.strokeStyle = foregroundColor;
    ctx.lineWidth = 1.5 / scale;

    let paths: string[] = [];
    switch (icon) {
        case 'Home':
            paths = ["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"];
            break;
        case 'Trees':
            paths = ["M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z", "M7 16v6", "M13 19v3", "M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"];
            break;
        case 'Mountain':
            paths = ["m8 3 4 8 5-5 5 15H2L8 3z"];
            break;
        case 'Castle':
             paths = ["M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z", "M18 11V4H6v7", "M15 22v-4a3 3 0 0 0-3-3a3 3 0 0 0-3 3v4", "M22 11V9", "M2 11V9", "M6 4V2", "M18 4V2", "M10 4V2", "M14 4V2"];
            break;
        case 'TowerControl':
            paths = ["M18.2 12.27 20 6H4l1.8 6.27a1 1 0 0 0 .95.73h10.5a1 1 0 0 0 .96-.73Z","M8 13v9","M16 22v-9","m9 6 1 7","m15 6-1 7","M12 6V2","M13 2h-2"];
            break;
    }
    
    paths.forEach(pathData => {
        const path = new Path2D(pathData);
        ctx.stroke(path);
    });

    ctx.restore();
};

const HexGrid: React.FC<HexGridProps> = ({ grid, hexSize = 25, className, onHexClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themeColors, setThemeColors] = useState({
    background: '#1A0024',
    border: '#4B0082',
    accent: '#8A2BE2',
    foreground: '#E0D6F0',
  });

  // State for pan, zoom, and hover
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [hoveredHex, setHoveredHex] = useState<Hex | null>(null);

  // State for drag-to-paint functionality
  const [isPainting, setIsPainting] = useState(false);
  const [lastPaintedHex, setLastPaintedHex] = useState<Hex | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      const bg = `hsl(${computedStyle.getPropertyValue('--background').trim()})`;
      const border = `hsl(${computedStyle.getPropertyValue('--border').trim()})`;
      const accent = `hsl(${computedStyle.getPropertyValue('--accent').trim()})`;
      const foreground = `hsl(${computedStyle.getPropertyValue('--foreground').trim()})`;
      setThemeColors({ background: bg, border, accent, foreground });
    }
  }, []);
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !themeColors.border) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = themeColors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Apply pan and zoom
    ctx.save();
    ctx.translate(centerX + view.x, centerY + view.y);
    ctx.scale(view.zoom, view.zoom);

    // Draw grid
    ctx.strokeStyle = themeColors.border;
    ctx.lineWidth = 1 / view.zoom; // Keep line width consistent when zooming

    grid.forEach(tile => {
      const { hex, data } = tile;
      const center = hexToPixel(hex, hexSize);
      
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const corner = getHexCorner(center, hexSize, i);
        if (i === 0) {
          ctx.moveTo(corner.x, corner.y);
        } else {
          ctx.lineTo(corner.x, corner.y);
        }
      }
      ctx.closePath();

      // Fill with stored color or default background
      ctx.fillStyle = data.color || themeColors.background;
      ctx.fill();

      // Draw border
      ctx.stroke();

      if (data.icon) {
        drawIcon(ctx, center, data.icon, hexSize, themeColors.foreground);
      }

      // Draw hover highlight
      if (hoveredHex && hex.q === hoveredHex.q && hex.r === hoveredHex.r) {
        ctx.fillStyle = themeColors.accent;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    });
    
    ctx.restore();

  }, [hexSize, themeColors, view, hoveredHex, grid]);


  useEffect(() => {
    draw();
  }, [draw]);

  const getHexFromMouseEvent = (e: React.MouseEvent<HTMLCanvasElement>): Hex | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - (rect.width / 2 + view.x)) / view.zoom;
      const worldY = (mouseY - (rect.height / 2 + view.y)) / view.zoom;
      
      const currentHex = pixelToHex(worldX, worldY, hexSize);

      const hexExists = grid.some(tile => tile.hex.q === currentHex.q && tile.hex.r === currentHex.r && tile.hex.s === currentHex.s);
      
      return hexExists ? currentHex : null;
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.button === 0) { // Left mouse button
        setIsPainting(true);
        if (onHexClick) {
            const clickedHex = getHexFromMouseEvent(e);
            if (clickedHex) {
                onHexClick(clickedHex);
                setLastPaintedHex(clickedHex);
            }
        }
    }
    if (e.button === 2) { // Right mouse button
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
        setIsPainting(false);
        setLastPaintedHex(null);
    }
    if (e.button === 2) {
      setIsPanning(false);
    }
  };
  
  const handleMouseLeave = () => {
    setIsPanning(false);
    setIsPainting(false);
    setLastPaintedHex(null);
    if (hoveredHex) {
        setHoveredHex(null);
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const currentHex = getHexFromMouseEvent(e);

    if (isPainting && onHexClick && currentHex) {
        if (!lastPaintedHex || (currentHex.q !== lastPaintedHex.q || currentHex.r !== lastPaintedHex.r)) {
            onHexClick(currentHex);
            setLastPaintedHex(currentHex);
        }
    }
    
    if (!isPainting) {
        if (currentHex) {
            if (!hoveredHex || hoveredHex.q !== currentHex.q || hoveredHex.r !== currentHex.r) {
                setHoveredHex(currentHex);
            }
        } else {
            if (hoveredHex !== null) {
                setHoveredHex(null);
            }
        }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 ? view.zoom * zoomFactor : view.zoom / zoomFactor;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse position to world coordinates before zoom
    const worldX = (mouseX - (rect.width / 2 + view.x)) / view.zoom;
    const worldY = (mouseY - (rect.height / 2 + view.y)) / view.zoom;
    
    // Calculate new offset to keep the world point under the mouse
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
