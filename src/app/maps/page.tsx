
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import MainLayout from "@/components/main-layout";
import HexGrid from "@/components/hexgrid/HexGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Paintbrush, Database, Home, Trees, Mountain, Castle, TowerControl, X, AlertCircle, Tent, Waves, MapPin, Landmark, Skull, Brush, PaintBucket, Eraser, Link as LinkIcon, Users, Plus, Trash2 } from "lucide-react";
import type { Hex, HexTile, Dungeon, Faction, Map as WorldMap, NewMap } from "@/lib/types";
import { generateHexGrid, resizeHexGrid } from "@/lib/hex-utils";
import { getAllDungeons, getAllFactions, getAllMaps, addMap, getMapById, updateMap, deleteMap } from "@/lib/idb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MultiItemSelectionDialog } from "@/components/multi-item-selection-dialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

const NewMapDialog = ({ onMapCreate }: { onMapCreate: (id: string) => void }) => {
    const [name, setName] = useState('');
    const [radius, setRadius] = useState(20);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleCreate = async () => {
        if (!name.trim() || !radius || radius <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide a valid name and radius.' });
            return;
        }
        try {
            const newGrid = generateHexGrid(radius);
            const newMap: NewMap = { name, radius, tiles: newGrid };
            const newId = await addMap(newMap);
            toast({ title: "Map Created!", description: `'${name}' has been added.`});
            onMapCreate(newId);
            setIsOpen(false);
            setName('');
            setRadius(20);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create new map.' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Plus className="h-4 w-4 mr-2" />New Map</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Map</DialogTitle>
                    <DialogDescription>Enter the details for your new world map.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-map-name" className="text-right">Name</Label>
                        <Input id="new-map-name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-map-radius" className="text-right">Radius</Label>
                        <Input id="new-map-radius" type="number" value={radius} onChange={e => setRadius(parseInt(e.target.value, 10) || 0)} min="1" max="100" className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function MapsPage() {
    const [maps, setMaps] = useState<WorldMap[]>([]);
    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
    const [activeMap, setActiveMap] = useState<WorldMap | null>(null);

    const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
    const [activeTool, setActiveTool] = useState<'paint' | 'data'>('paint');
    const [paintMode, setPaintMode] = useState<'brush' | 'bucket' | 'erase'>('brush');
    const [paintColor, setPaintColor] = useState('#8A2BE2');
    const [paintIcon, setPaintIcon] = useState<string | null>(null);

    const [manualIconColor, setManualIconColor] = useState('#E0D6F0');
    const [isIconColorAuto, setIsIconColorAuto] = useState(true);
    const [finalIconColor, setFinalIconColor] = useState('#E0D6F0');
    
    const [allDungeons, setAllDungeons] = useState<Dungeon[]>([]);
    const [allFactions, setAllFactions] = useState<Faction[]>([]);

    const { toast } = useToast();
    const debouncedActiveMap = useDebounce(activeMap, 1000);

    const loadAllMaps = useCallback(async () => {
        const allMaps = await getAllMaps();
        setMaps(allMaps.sort((a,b) => a.name.localeCompare(b.name)));
        if (!selectedMapId && allMaps.length > 0) {
            setSelectedMapId(allMaps[0].id);
        }
    }, [selectedMapId]);
    
    useEffect(() => {
        loadAllMaps();
        getAllDungeons().then(setAllDungeons);
        getAllFactions().then(setAllFactions);
    }, [loadAllMaps]);
    
    useEffect(() => {
        if (debouncedActiveMap) {
            updateMap(debouncedActiveMap).catch(() => {
                toast({ variant: 'destructive', title: 'Auto-save failed' });
            });
        }
    }, [debouncedActiveMap, toast]);
    
    useEffect(() => {
        if (selectedMapId) {
            getMapById(selectedMapId).then(mapData => {
                if (mapData) setActiveMap(mapData);
            });
            setSelectedHex(null); // Deselect hex when changing map
        } else {
            setActiveMap(null);
        }
    }, [selectedMapId]);
    
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


    const handleMapCreate = (newId: string) => {
        loadAllMaps().then(() => {
            setSelectedMapId(newId);
        });
    };
    
    const handleDeleteMap = async () => {
        if (!selectedMapId) return;
        try {
            await deleteMap(selectedMapId);
            toast({ title: "Map Deleted" });
            setSelectedMapId(null);
            setActiveMap(null);
            loadAllMaps();
        } catch {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete map.' });
        }
    }
    
    const handleGridUpdate = (newGrid: HexTile[]) => {
        if (activeMap) {
            setActiveMap({ ...activeMap, tiles: newGrid });
        }
    };

    const handleUpdateTileData = (hex: Hex, updates: Partial<HexTile['data']>) => {
        if (activeMap) {
            const newTiles = activeMap.tiles.map(tile => {
                if (tile.hex.q === hex.q && tile.hex.r === hex.r) {
                    return {
                        ...tile,
                        data: { ...tile.data, ...updates }
                    };
                }
                return tile;
            });
            setActiveMap({ ...activeMap, tiles: newTiles });
        }
    };
    
    const isEraseMode = paintMode === 'erase';
    const selectedTile = useMemo(() => activeMap?.tiles.find(t => t.hex.q === selectedHex?.q && t.hex.r === selectedHex?.r), [activeMap, selectedHex]);
    const dungeonMap = useMemo(() => new Map(allDungeons.map(d => [d.id, d])), [allDungeons]);
    const factionMap = useMemo(() => new Map(allFactions.map(f => [f.id, f])), [allFactions]);
    
    return (
        <MainLayout showSidebarTrigger={false}>
            <div className="w-full h-full bg-background relative">
                {activeMap ? (
                    <HexGrid 
                        grid={activeMap.tiles} 
                        hexSize={25} 
                        className="w-full h-full" 
                        onGridUpdate={handleGridUpdate}
                        onHexHover={() => {}} // Hover logic now internal to HexGrid for performance
                        onHexClick={setSelectedHex}
                        activeTool={activeTool}
                        paintMode={paintMode}
                        paintColor={paintColor}
                        paintIcon={paintIcon}
                        paintIconColor={finalIconColor}
                        selectedHex={selectedHex}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <p>Select a map to begin, or create a new one.</p>
                    </div>
                )}


                <Card className="fixed top-20 left-4 z-10 w-80 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Wrench className="h-5 w-5" />
                            Map Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 mb-4">
                           <div className="space-y-2">
                                <Label>Map Selection</Label>
                                <div className="flex gap-2">
                                    <Select value={selectedMapId || ''} onValueChange={setSelectedMapId}>
                                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select a map..."/></SelectTrigger>
                                        <SelectContent>
                                            {maps.map(map => <SelectItem key={map.id} value={map.id}>{map.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <NewMapDialog onMapCreate={handleMapCreate}/>
                                    {selectedMapId && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete Map?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete '{activeMap?.name}'? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteMap}>Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Tabs value={activeTool} onValueChange={(value) => setActiveTool(value as 'paint' | 'data')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="paint"><Paintbrush className="h-4 w-4 mr-2" />Paint</TabsTrigger>
                                <TabsTrigger value="data"><Database className="h-4 w-4 mr-2" />Data</TabsTrigger>
                            </TabsList>
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
                                {selectedHex && selectedTile ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-semibold text-base">Selected Tile</p>
                                            <p className="text-sm"><span className="font-semibold">Q:</span> {selectedHex.q}, <span className="font-semibold">R:</span> {selectedHex.r}, <span className="font-semibold">S:</span> {selectedHex.s}</p>
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label className="flex items-center gap-2"><MapPin className="h-4 w-4"/>Dungeons</Label>
                                                <MultiItemSelectionDialog
                                                    title="Link Dungeons"
                                                    items={allDungeons}
                                                    initialSelectedIds={selectedTile.data.dungeonIds || []}
                                                    onConfirm={(ids) => handleUpdateTileData(selectedHex, { dungeonIds: ids })}
                                                    trigger={<Button size="sm" variant="outline"><LinkIcon className="h-4 w-4"/></Button>}
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {(selectedTile.data.dungeonIds || []).map(id => <Badge key={id} variant="secondary">{dungeonMap.get(id)?.name}</Badge>)}
                                            </div>
                                        </div>
                                        
                                        <Separator />

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label className="flex items-center gap-2"><Users className="h-4 w-4"/>Factions</Label>
                                                <MultiItemSelectionDialog
                                                    title="Link Factions"
                                                    items={allFactions}
                                                    initialSelectedIds={selectedTile.data.factionIds || []}
                                                    onConfirm={(ids) => handleUpdateTileData(selectedHex, { factionIds: ids })}
                                                    trigger={<Button size="sm" variant="outline"><LinkIcon className="h-4 w-4"/></Button>}
                                                />
                                            </div>
                                             <div className="flex flex-wrap gap-1">
                                                {(selectedTile.data.factionIds || []).map(id => <Badge key={id} variant="secondary">{factionMap.get(id)?.name}</Badge>)}
                                            </div>
                                        </div>

                                    </div>
                                ) : (
                                     <p className="text-sm text-muted-foreground">Click on a tile to see or edit its data.</p>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
