
"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/main-layout";
import HexGrid from "@/components/hexgrid/HexGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Paintbrush, Database, Home, Trees, Mountain, Castle, TowerControl, X } from "lucide-react";
import type { Hex, HexTile } from "@/lib/types";
import { generateHexGrid } from "@/lib/hex-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const ICONS = [
    { name: 'Home', component: Home },
    { name: 'Trees', component: Trees },
    { name: 'Mountain', component: Mountain },
    { name: 'Castle', component: Castle },
    { name: 'TowerControl', component: TowerControl },
]

const TERRAIN_COLORS = [
    { name: 'Water', color: '#4A90E2' },
    { name: 'Grass', color: '#7ED321' },
    { name: 'Forest', color: '#417505' },
    { name: 'Stone', color: '#9B9B9B' },
    { name: 'Desert', color: '#F5A623' },
    { name: 'Snow', color: '#FFFFFF' },
];

export default function MapsPage() {
    const [grid, setGrid] = useState<HexTile[]>([]);
    const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
    const [activeTool, setActiveTool] = useState<'paint' | 'data'>('paint');
    const [paintColor, setPaintColor] = useState('#8A2BE2'); // Default to accent color
    const [paintIconColor, setPaintIconColor] = useState('#E0D6F0'); // Default to foreground
    const [paintIcon, setPaintIcon] = useState<string | null>(null);

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
                            color: paintColor,
                            icon: paintIcon,
                            iconColor: paintIconColor,
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
                                <div className="space-y-4">
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="color-picker">Tile Color</Label>
                                            <Input id="color-picker" type="color" value={paintColor} onChange={(e) => setPaintColor(e.target.value)} className="w-full h-10 p-1" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="icon-color-picker">Icon Color</Label>
                                            <Input id="icon-color-picker" type="color" value={paintIconColor} onChange={(e) => setPaintIconColor(e.target.value)} className="w-full h-10 p-1" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Terrain Colors</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {TERRAIN_COLORS.map(({ name, color }) => (
                                                <Button
                                                    key={name}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() => setPaintColor(color)}
                                                >
                                                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }} />
                                                    <span className="ml-2">{name}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />
                                    
                                    <div className="space-y-2">
                                        <Label>Tile Icon</Label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {ICONS.map(({ name, component: Icon }) => (
                                                <Button
                                                    key={name}
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setPaintIcon(prev => prev === name ? null : name)}
                                                    className={cn(paintIcon === name && "ring-2 ring-ring ring-offset-2 bg-accent text-accent-foreground")}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </Button>
                                            ))}
                                        </div>
                                         {paintIcon && (
                                            <Button variant="ghost" size="sm" className="w-full h-8" onClick={() => setPaintIcon(null)}>
                                                <X className="h-4 w-4 mr-2" /> Clear Icon Selection
                                            </Button>
                                        )}
                                    </div>
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
