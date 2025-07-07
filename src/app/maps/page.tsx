
"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/main-layout";
import HexGrid from "@/components/hexgrid/HexGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Paintbrush, Database } from "lucide-react";
import type { Hex, HexTile } from "@/lib/types";
import { generateHexGrid } from "@/lib/hex-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function MapsPage() {
    const [grid, setGrid] = useState<HexTile[]>([]);
    const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
    const [activeTool, setActiveTool] = useState<'paint' | 'data'>('paint');
    const [paintColor, setPaintColor] = useState('#8A2BE2'); // Default to accent color

    useEffect(() => {
        setGrid(generateHexGrid(20));
    }, []);

    const handleHexClick = (hex: Hex) => {
        setSelectedHex(hex);

        if (activeTool === 'paint') {
            const newGrid = grid.map(tile => {
                if (tile.hex.q === hex.q && tile.hex.r === hex.r && tile.hex.s === hex.s) {
                    return {
                        ...tile,
                        data: {
                            ...tile.data,
                            color: paintColor
                        }
                    };
                }
                return tile;
            });
            setGrid(newGrid);
        }
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

                <Card className="fixed top-20 left-4 z-10 w-80 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Wrench className="h-5 w-5" />
                            Map Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTool} onValueChange={(value) => setActiveTool(value as 'paint' | 'data')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="paint"><Paintbrush className="h-4 w-4 mr-2" />Paint</TabsTrigger>
                                <TabsTrigger value="data"><Database className="h-4 w-4 mr-2" />Data</TabsTrigger>
                            </TabsList>
                            <TabsContent value="paint" className="mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="color-picker">Tile Color</Label>
                                    <Input id="color-picker" type="color" value={paintColor} onChange={(e) => setPaintColor(e.target.value)} className="w-full h-10 p-1" />
                                </div>
                            </TabsContent>
                            <TabsContent value="data" className="mt-4">
                                {selectedHex ? (
                                    <div className="text-sm space-y-1">
                                        <p className="font-semibold text-base">Selected Tile</p>
                                        <p><span className="font-semibold">Q:</span> {selectedHex.q}</p>
                                        <p><span className="font-semibold">R:</span> {selectedHex.r}</p>
                                        <p><span className="font-semibold">S:</span> {selectedHex.s}</p>
                                    </div>
                                ) : (
                                     <p className="text-sm text-muted-foreground">Click on a tile to see its coordinates.</p>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
