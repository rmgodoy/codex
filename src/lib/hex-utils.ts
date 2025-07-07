
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

// Convert hex coordinates to pixel coordinates (pointy-top layout)
export const hexToPixel = (hex: Hex, size: number): { x: number; y: number } => {
    const x = size * (Math.sqrt(3) * hex.q + Math.sqrt(3) / 2 * hex.r);
    const y = size * (3 / 2 * hex.r);
    return { x, y };
};

// Get the corners of a hexagon for drawing (pointy-top hexagons)
export const getHexCorner = (center: { x: number; y: number }, size: number, i: number): { x: number; y: number } => {
    const angle_deg = 60 * i;
    const angle_rad = Math.PI / 180 * angle_deg;
    return {
        x: center.x + size * Math.cos(angle_rad),
        y: center.y + size * Math.sin(angle_rad)
    };
};


// Round fractional hex coordinates to the nearest integer hex
const hexRound = (q: number, r: number, s: number): Hex => {
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

    return { q: rq, r: rr, s: rs };
};


// Convert pixel coordinates to hex coordinates (for pointy-top layout)
export const pixelToHex = (x: number, y: number, size: number): Hex => {
    const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
    const r = (2 / 3 * y) / size;
    return hexRound(q, r, -q - r);
};
