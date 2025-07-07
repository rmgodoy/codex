
"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/main-layout";
import HexGrid from "@/components/hexgrid/HexGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Paintbrush, Database, Home, Trees, Mountain, Castle, TowerControl, X, AlertCircle, Tent, Waves, MapPin, Landmark, Skull, Brush, PaintBucket, Eraser } from "lucide-react";
import type { Hex, HexTile } from "@/lib/types";
import { generateHexGrid, resizeHexGrid } from "@/lib/hex-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ICONS = [
    { name: 'Home', component: Home },
    { name: 'Trees', component: Trees },
    { name: 'Mountain', component: Mountain },
    { name: 'Castle', component: Castle },
    { name: 'TowerControl', component: TowerControl },
    { name: 'Tent', component: Tent },
    { name: 'Waves', component: Waves },
    { name: 'MapPin', component: MapPin },
    { name: 'Landmark', component: Landmark },
    { name: 'Skull', component: Skull },
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
    const [radius, setRadius] = useState(20);
    const [mapName, setMapName] = useState("My World Map");
    const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
    const [activeTool, setActiveTool] = useState<'settings' | 'paint' | 'data'>('settings');
    const [paintMode, setPaintMode] = useState<'brush' | 'bucket' | 'erase'>('brush');
    const [paintColor, setPaintColor] = useState('#8A2BE2');
    const [paintIcon, setPaintIcon] = useState<string | null>(null);

    const [manualIconColor, setManualIconColor] = useState('#E0D6F0');
    const [isIconColorAuto, setIsIconColorAuto] = useState(true);
    const [finalIconColor, setFinalIconColor] = useState('#E0D6F0');

    const getLuminance = (hex: string) => {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return lum;
    };

    useEffect(() => {
        if (isIconColorAuto) {
            const lum = getLuminance(paintColor);
            setFinalIconColor(lum > 0.5 ? '#000000' : '#FFFFFF');
        } else {
            setFinalIconColor(manualIconColor);
        }
    }, [isIconColorAuto, paintColor, manualIconColor]);


    useEffect(() => {
        setGrid(generateHexGrid(20));
    }, []);

    const handleRadiusChange = (newRadiusValue: number) => {
        setRadius(newRadiusValue); // Can be NaN, which is fine for the input's controlled state.
        if (!isNaN(newRadiusValue) && newRadiusValue > 0 && newRadiusValue <= 50) {
            setGrid(prevGrid => resizeHexGrid(prevGrid, newRadiusValue));
        }
    };
    
    const handleGridUpdate = (newGrid: HexTile[]) => {
        setGrid(newGrid);
    };

    const isEraseMode = paintMode === 'erase';

    return (
        <MainLayout showSidebarTrigger={false}>
            <div className="w-full h-full bg-background relative">
                <HexGrid 
                    grid={grid} 
                    hexSize={25} 
                    className="w-full h-full" 
                    onGridUpdate={handleGridUpdate}
                    onHexHover={setSelectedHex}
                    paintMode={paintMode}
                    paintColor={paintColor}
                    paintIcon={paintIcon}
                    paintIconColor={finalIconColor}
                />

                <Card className="fixed top-20 left-4 z-10 w-80 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Wrench className="h-5 w-5" />
                            Map Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTool} onValueChange={(value) => setActiveTool(value as 'settings' |'paint' | 'data')} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="settings"><Wrench className="h-4 w-4 mr-2" />Settings</TabsTrigger>
                                <TabsTrigger value="paint"><Paintbrush className="h-4 w-4 mr-2" />Paint</TabsTrigger>
                                <TabsTrigger value="data"><Database className="h-4 w-4 mr-2" />Data</TabsTrigger>
                            </TabsList>
                            <TabsContent value="settings" className="mt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="map-name">Map Name</Label>
                                        <Input id="map-name" value={mapName} onChange={(e) => setMapName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="map-radius">Map Radius</Label>
                                        <Input
                                            id="map-radius"
                                            type="number"
                                            value={radius || ''}
                                            onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
                                            min="1"
                                            max="50"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="paint" className="mt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Paint Mode</Label>
                                        <ToggleGroup type="single" value={paintMode} onValueChange={(value) => { if (value) setPaintMode(value as 'brush' | 'bucket' | 'erase') }} className="w-full">
                                            <ToggleGroupItem value="brush" aria-label="Brush" className="w-1/3">
                                                <Brush className="h-4 w-4 mr-2" /> Brush
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="bucket" aria-label="Bucket" className="w-1/3">
                                                <PaintBucket className="h-4 w-4 mr-2" /> Bucket
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="erase" aria-label="Erase" className="w-1/3">
                                                <Eraser className="h-4 w-4 mr-2" /> Erase
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    </div>
                                    <Separator />
                                     <fieldset disabled={isEraseMode} className="space-y-4 disabled:opacity-50">
                                        <div className="space-y-2">
                                            <Label htmlFor="color-picker">Tile Color</Label>
                                            <Input id="color-picker" type="color" value={paintColor} onChange={(e) => setPaintColor(e.target.value)} className="w-full h-10 p-1" />
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
                                            <div className="flex justify-between items-center mb-2">
                                                <Label>Tile Icon</Label>
                                                <div className="flex items-center gap-1">
                                                    {!isIconColorAuto && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => setIsIconColorAuto(true)}
                                                                    >
                                                                        <AlertCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Reset to automatic color</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    <Input
                                                        id="icon-color-picker"
                                                        type="color"
                                                        value={manualIconColor}
                                                        onChange={(e) => {
                                                            setManualIconColor(e.target.value);
                                                            setIsIconColorAuto(false);
                                                        }}
                                                        className="w-10 h-10 p-1"
                                                    />
                                                </div>
                                            </div>
                                            
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
                                     </fieldset>
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
