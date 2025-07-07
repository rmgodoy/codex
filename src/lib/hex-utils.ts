
export interface Point {
    x: number;
    y: number;
}

export interface HexCoords {
    q: number; // column
    r: number; // row
    s: number; // sum
}

// Converts axial hex coordinates to pixel coordinates for pointy-topped hexes
export function pointyHexToPixel(q: number, r: number, size: number): Point {
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * ((3 / 2) * r);
    return { x, y };
}

// Generates a grid of hexagons in a hexagonal shape using cube coordinates
export function generateHexagonGrid(radius: number): HexCoords[] {
    const hexes: HexCoords[] = [];
    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
            hexes.push({ q, r, s: -q - r });
        }
    }
    return hexes;
}
