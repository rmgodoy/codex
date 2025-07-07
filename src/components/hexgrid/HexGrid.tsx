
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { generateHexGrid, hexToPixel, getHexCorner, type Hex } from '@/lib/hex-utils';

interface HexGridProps {
  gridRadius?: number;
  hexSize?: number;
  className?: string;
}

const HexGrid: React.FC<HexGridProps> = ({ gridRadius = 20, hexSize = 20, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themeColors, setThemeColors] = useState({
    background: '#1A0024',
    border: '#4B0082'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      const bg = `hsl(${computedStyle.getPropertyValue('--background').trim()})`;
      const border = `hsl(${computedStyle.getPropertyValue('--border').trim()})`;
      setThemeColors({ background: bg, border: border });
    }
  }, []);

  useEffect(() => {
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
    
    // Draw grid
    ctx.strokeStyle = themeColors.border;
    ctx.lineWidth = 1;

    const hexes = generateHexGrid(gridRadius);

    hexes.forEach(hex => {
      const pixel = hexToPixel(hex, hexSize);
      const center = { x: pixel.x + centerX, y: pixel.y + centerY };
      
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

  }, [gridRadius, hexSize, themeColors]);

  return <canvas ref={canvasRef} className={className} />;
};

export default HexGrid;
