
"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/main-layout";
import HexGrid from "@/components/hexgrid/HexGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pin } from "lucide-react";
import type { Hex, HexTile } from "@/lib/types";
import { generateHexGrid } from "@/lib/hex-utils";

export default function MapsPage() {
    const [grid, setGrid] = useState<HexTile[]>([]);
    const [selectedHex, setSelectedHex] = useState<Hex | null>(null);

    useEffect(() => {
        setGrid(generateHexGrid(20));
    }, []);

    const handleHexClick = (hex: Hex) => {
        setSelectedHex(hex);
    }

    return (
        <MainLayout showSidebarTrigger={false}>
            <div className="w-full h-full bg-background relative">
                <HexGrid 
                    grid={grid} 
                    hexSize={25} 
                    className="w-full h-full" 
                    onHexClick={handleHexClick}
                />

                <Card className="fixed top-20 left-4 z-10 w-64 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Pin className="h-5 w-5" />
                            Tile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedHex ? (
                            <div className="text-sm space-y-1">
                                <p><span className="font-semibold">Q:</span> {selectedHex.q}</p>
                                <p><span className="font-semibold">R:</span> {selectedHex.r}</p>
                                <p><span className="font-semibold">S:</span> {selectedHex.s}</p>
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground">Click on a tile to see its coordinates.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
