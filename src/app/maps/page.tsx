
"use client";

import { useMemo } from 'react';
import MainLayout from "@/components/main-layout";
// react-hex-engine does not have official TypeScript definitions.
// @ts-ignore
import * as HexEngine from 'react-hex-engine';

export default function MapsPage() {
    const hexagons = useMemo(() => HexEngine.GridGenerator.hexagon(20), []);

    return (
        <MainLayout showSidebarTrigger={false}>
            <div className="w-full h-full bg-background hexgrid-container">
                <HexEngine.HexGrid width="100%" height="100%" className="hex-engine-grid">
                    {hexagons.map((hex: any, i: number) => (
                        <HexEngine.Hexagon key={i} q={hex.q} r={hex.r} s={hex.s} />
                    ))}
                </HexEngine.HexGrid>
            </div>
        </MainLayout>
    );
}
