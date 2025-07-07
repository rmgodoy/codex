"use client";

import React, { useRef, useEffect } from 'react';
import { generateHexagonGrid, pointyHexToPixel } from '@/lib/hex-utils';

interface HexGridProps {
    radius: number;
    hexSize?: number;
}

const HexGrid: React.FC<HexGridProps> = ({ radius, hexSize = 25 }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle high-DPI displays for crisp rendering
        const pixelRatio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * pixelRatio;
        canvas.height = rect.height * pixelRatio;
        ctx.scale(pixelRatio, pixelRatio);
        
        const width = rect.width;
        const height = rect.height;

        const centerX = width / 2;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "hsl(var(--background))";
        ctx.fillRect(0, 0, width, height);

        const hexes = generateHexagonGrid(radius);

        hexes.forEach(hex => {
            const pixel = pointyHexToPixel(hex.q, hex.r, hexSize);
            drawHexagon(ctx, { x: centerX + pixel.x, y: centerY + pixel.y }, hexSize);
        });

    }, [radius, hexSize]);

    const drawHexagon = (ctx: CanvasRenderingContext2D, center: { x: number; y: number }, size: number) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angleDeg = 60 * i + 30; // +30 degrees for pointy top orientation
            const angleRad = (Math.PI / 180) * angleDeg;
            const x = center.x + size * Math.cos(angleRad);
            const y = center.y + size * Math.sin(angleRad);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.strokeStyle = "hsl(var(--border))";
        ctx.lineWidth = 1;
        ctx.stroke();
    };

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default HexGrid;
