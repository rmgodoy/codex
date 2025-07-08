
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import MainLayout from "@/components/main-layout";
import HexGrid from "@/components/hexgrid/HexGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Paintbrush, Database, Home, Trees, Mountain, Castle, TowerControl, X, AlertCircle, Tent, Waves, MapPin, Landmark, Skull, Brush, PaintBucket, Eraser, Link as LinkIcon, Users, Plus, Trash2, Cog, Check, Edit, Eyedropper } from "lucide-react";
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

function MapManagementDialog({ maps, onMapsUpdate }: { maps: WorldMap[], onMapsUpdate: (newMapId?: string) => void }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newMapName, setNewMapName] = useState("");
    const [newMapRadius, setNewMapRadius] = useState(20);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const { toast } = useToast();

    const handleAddMap = async () => {
        if (!newMapName.trim() || !newMapRadius || newMapRadius <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide a valid name and radius.' });
            return;
        }
        try {
            const newGrid = generateHexGrid(newMapRadius);
            const newMap: NewMap = { name: newMapName.trim(), radius: newMapRadius, tiles: newGrid };
            const newId = await addMap(newMap);
            toast({ title: 'Map Created', description: `'${newMapName}' has been added.` });
            setNewMapName("");
            setNewMapRadius(20);
            onMapsUpdate(newId);
            setIsDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create map.' });
        }
    };

    const handleStartEdit = (map: WorldMap) => {
        setEditingId(map.id);
        setEditingName(map.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName("");
    };

    const handleRenameMap = async () => {
        if (!editingId || !editingName.trim()) return;
        const mapToUpdate = maps.find(m => m.id === editingId);
        if (!mapToUpdate) return;
        try {
            await updateMap({ ...mapToUpdate, name: editingName.trim() });
            toast({ title: 'Map Renamed' });
            onMapsUpdate();
            handleCancelEdit();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename map.' });
        }
    };

    const handleDeleteMap = async (mapId: string) => {
        try {
            await deleteMap(mapId);
            toast({ title: 'Map Deleted' });
            onMapsUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete map.' });
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Cog className="h-5 w-5" /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Maps</DialogTitle>
                    <DialogDescription>Add, rename, or delete your maps.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-end gap-2 p-3 border rounded-md">
                        <div className="grid gap-2 flex-1">
                          <Label>New Map</Label>
                          <Input 
                              placeholder="New map name..." 
                              value={newMapName}
                              onChange={(e) => setNewMapName(e.target.value)}
                          />
                          <Input 
                              placeholder="Radius" 
                              type="number"
                              value={newMapRadius}
                              onChange={(e) => setNewMapRadius(parseInt(e.target.value, 10) || 0)}
                          />
                        </div>
                        <Button onClick={handleAddMap} disabled={!newMapName.trim() || !newMapRadius || newMapRadius <=0}><Plus className="h-4 w-4" /> Add</Button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {maps.map(map => (
                            <div key={map.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 gap-2">
                                {editingId === map.id ? (
                                    <>
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameMap() }}
                                            className="h-8"
                                            autoFocus
                                        />
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" className="h-7 w-7" onClick={handleRenameMap} aria-label="Save">
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEdit} aria-label="Cancel">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1 truncate" title={map.name}>{map.name}</span>
                                        <div className="flex items-center shrink-0">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(map)} aria-label="Edit">
                                                <Edit className="h-4 w-4"/>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete the "{map.name}" map and all of its tiles.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteMap(map.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function MapsPage() {
    const [maps, setMaps] = useState<WorldMap[]>([]);
    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
    const [activeMap, setActiveMap] = useState<WorldMap | null>(null);

    const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
    const [activeTool, setActiveTool] = useState<'settings' | 'paint' | 'data'>('settings');
    const [paintMode, setPaintMode] = useState<'brush' | 'bucket' | 'erase'>('brush');
    const [paintColor, setPaintColor] = useState('#8A2BE2');
    const [paintIcon, setPaintIcon] = useState<string | null>(null);

    const [manualIconColor, setManualIconColor] = useState('#E0D6F0');
    const [isIconColorAuto, setIsIconColorAuto] = useState(true);
    const [finalIconColor, setFinalIconColor] = useState('#E0D6F0');
    
    const [allDungeons, setAllDungeons] = useState<Dungeon[]>([]);
    const [allFactions, setAllFactions] = useState<Faction[]>([]);
    
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);
    const [isEyedropperActive, setIsEyedropperActive] = useState(false);

    const { toast } = useToast();
    const debouncedActiveMap = useDebounce(activeMap, 1000);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const loadAllMaps = useCallback(async (newlyCreatedMapId?: string) => {
        const allMaps = await getAllMaps();
        const sortedMaps = allMaps.sort((a,b) => a.name.localeCompare(b.name));
        setMaps(sortedMaps);

        if (newlyCreatedMapId) {
            setSelectedMapId(newlyCreatedMapId);
            return;
        }

        const currentSelectedId = selectedMapId;

        // If a map is selected, check if it still exists.
        if (currentSelectedId && !sortedMaps.some(m => m.id === currentSelectedId)) {
            // It was deleted. Select the first map, or null if no maps exist.
            setSelectedMapId(sortedMaps.length > 0 ? sortedMaps[0].id : null);
        } else if (!currentSelectedId && sortedMaps.length > 0) {
            // No map was selected, but maps exist. Select the first one.
            setSelectedMapId(sortedMaps[0].id);
        } else if (sortedMaps.length === 0) {
            // No maps exist at all.
            setSelectedMapId(null);
            setActiveMap(null);
        }
    }, [selectedMapId]);
    
    useEffect(() => {
        loadAllMaps();
        getAllDungeons().then(setAllDungeons);
        getAllFactions().then(setAllFactions);
    }, []);
    
    const handleMapsUpdate = (newMapId?: string) => {
        loadAllMaps(newMapId);
    };

    useEffect(() => {
        if (debouncedActiveMap) {
            updateMap(debouncedActiveMap).catch(() => {
                toast({ variant: 'destructive', title: 'Auto-save failed' });
            });
            setMaps(prevMaps => prevMaps.map(m => m.id === debouncedActiveMap.id ? { ...m, name: debouncedActiveMap.name } : m));
        }
    }, [debouncedActiveMap, toast]);
    
    useEffect(() => {
        if (selectedMapId) {
            getMapById(selectedMapId).then(mapData => {
                if (mapData) setActiveMap(mapData);
            });
            setSelectedHex(null); 
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
    
    const handleEyedropperClick = (hex: Hex) => {
        if (!activeMap) return;
        const tile = activeMap.tiles.find(t => t.hex.q === hex.q && t.hex.r === hex.r);
        if (tile) {
            setPaintColor(tile.data.color || '#8A2BE2');
            setPaintIcon(tile.data.icon || null);
            if (tile.data.iconColor) {
                setManualIconColor(tile.data.iconColor);
                setIsIconColorAuto(false);
            }
        }
        setIsEyedropperActive(false);
        toast({ title: 'Tile properties copied to brush.' });
    };

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

    const handleMapSettingsChange = (field: 'name' | 'radius', value: string | number) => {
        if (!activeMap) return;

        if (field === 'radius') {
            const newRadius = Number(value);
            if (!isNaN(newRadius) && newRadius > 0 && newRadius <= 100) {
                const newGrid = resizeHexGrid(activeMap.tiles, newRadius);
                setActiveMap({ ...activeMap, radius: newRadius, tiles: newGrid });
            }
        } else {
            setActiveMap({ ...activeMap, [field]: value as string });
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
                        className={cn("w-full h-full", isEyedropperActive && 'cursor-crosshair')} 
                        onGridUpdate={handleGridUpdate}
                        onHexHover={() => {}} 
                        onHexClick={setSelectedHex}
                        activeTool={activeTool}
                        paintMode={paintMode}
                        paintColor={paintColor}
                        paintIcon={paintIcon}
                        paintIconColor={finalIconColor}
                        selectedHex={selectedHex}
                        isCtrlPressed={isCtrlPressed}
                        isEyedropperActive={isEyedropperActive}
                        onEyedropperClick={handleEyedropperClick}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <p>Select a map to begin, or create a new one.</p>
                    </div>
                )}


                <Card className="fixed top-20 left-4 z-10 w-80 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            Map Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTool} onValueChange={(value) => setActiveTool(value as 'settings' | 'paint' | 'data')} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="settings"><Wrench className="h-4 w-4 mr-2" />Settings</TabsTrigger>
                                <TabsTrigger value="paint"><Paintbrush className="h-4 w-4 mr-2" />Paint</TabsTrigger>
                                <TabsTrigger value="data"><Database className="h-4 w-4 mr-2" />Data</TabsTrigger>
                            </TabsList>
                            <TabsContent value="settings" className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Map Selection</Label>
                                    <div className="flex gap-2">
                                        <Select value={selectedMapId || ''} onValueChange={setSelectedMapId}>
                                            <SelectTrigger className="flex-1"><SelectValue placeholder="Select a map..."/></SelectTrigger>
                                            <SelectContent>
                                                {maps.map(map => <SelectItem key={map.id} value={map.id}>{map.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <MapManagementDialog maps={maps} onMapsUpdate={handleMapsUpdate} />
                                    </div>
                                </div>
                                <Separator/>
                                {activeMap ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="map-name">Map Name</Label>
                                            <Input
                                                id="map-name"
                                                value={activeMap.name}
                                                onChange={(e) => handleMapSettingsChange('name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="map-radius">Map Radius</Label>
                                            <Input
                                                id="map-radius"
                                                type="number"
                                                value={activeMap.radius}
                                                onChange={(e) => handleMapSettingsChange('radius', parseInt(e.target.value, 10))}
                                                min="1"
                                                max="100"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center pt-4">Select a map to view its settings, or create a new one.</p>
                                )}
                            </TabsContent>
                            <TabsContent value="paint" className="mt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Paint Mode</Label>
                                        <ToggleGroup type="single" value={isCtrlPressed && paintMode === 'brush' ? 'bucket' : paintMode} onValueChange={(value) => { if (value) setPaintMode(value as 'brush' | 'bucket' | 'erase') }} className="w-full">
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
                                     <fieldset disabled={isEraseMode || isEyedropperActive} className="space-y-4 disabled:opacity-50">
                                        <div className="space-y-2">
                                            <Label htmlFor="color-picker">Tile Color</Label>
                                            <Input id="color-picker" type="color" value={paintColor} onChange={(e) => setPaintColor(e.target.value)} className="w-full h-10 p-1" />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label>Terrain Colors</Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant={isEyedropperActive ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setIsEyedropperActive(prev => !prev)}>
                                                                <Eyedropper className="h-4 w-4"/>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Pick Tile Properties</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
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

