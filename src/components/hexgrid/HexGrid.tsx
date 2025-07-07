
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { generateHexGrid, hexToPixel, getHexCorner, type Hex } from '@/lib/hex-utils';

interface HexGridProps {
  gridRadius?: number;
  hexSize?: number;
  className?: string;
}

const HexGrid: React.FC<HexGridProps> = ({ gridRadius = 20, hexSize = 25, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themeColors, setThemeColors] = useState({
    background: '#1A0024',
    border: '#4B0082'
  });

  // State for pan and zoom
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const hexes = useRef(generateHexGrid(gridRadius));


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      const bg = `hsl(${computedStyle.getPropertyValue('--background').trim()})`;
      const border = `hsl(${computedStyle.getPropertyValue('--border').trim()})`;
      setThemeColors({ background: bg, border: border });
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

    hexes.current.forEach(hex => {
      const center = hexToPixel(hex, hexSize); // these are relative to grid origin (0,0)
      
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
      ctx.stroke();
    });
    
    ctx.restore();

  }, [hexSize, themeColors, view]);


  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) { // Right mouse button
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) {
      setIsPanning(false);
    }
  };
  
  const handleMouseLeave = () => {
      setIsPanning(false);
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
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
