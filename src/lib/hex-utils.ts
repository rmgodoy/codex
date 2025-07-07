
'use client';

// Hexagonal grid utility functions (axial coordinates)

export interface Hex {
    q: number;
    r: number;
    s: number;
}

export const generateHexGrid = (radius: number): Hex[] => {
    const hexes: Hex[] = [];
    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
            hexes.push({ q, r, s: -q - r });
        }
    }
    return hexes;
};

export const hexToPixel = (hex: Hex, size: number): { x: number; y: number } => {
    const x = size * (3 / 2 * hex.q);
    const y = size * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r);
    return { x, y };
};

export const getHexCorner = (center: { x: number; y: number }, size: number, i: number): { x: number; y: number } => {
    const angle_deg = 60 * i + 30; // +30 to make pointy top
    const angle_rad = Math.PI / 180 * angle_deg;
    return {
        x: center.x + size * Math.cos(angle_rad),
        y: center.y + size * Math.sin(angle_rad)
    };
};
