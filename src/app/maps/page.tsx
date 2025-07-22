
"use client";

import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/main-layout";
import HexGrid from "@/components/hexgrid/HexGrid";
import type { Hex, HexTile, Dungeon, Faction, Map as WorldMap, CalendarEvent, Path, City } from "@/lib/types";
import { getAllDungeons, getAllFactions, getAllMaps, getMapById, updateMap, getAllCalendarEvents, getAllCities, updateCity } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-is-mobile";
import MapToolsPanel from "@/components/maps/map-tools-panel";
import { useWorld } from "@/components/world-provider";
import { cn } from "@/lib/utils";

export default function MapsPage() {
    const [maps, setMaps] = useState<WorldMap[]>([]);
    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
    const [activeMap, setActiveMap] = useState<WorldMap | null>(null);

    const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
    const [activeTool, setActiveTool] = useState<'settings' | 'paint' | 'path' | 'data'>('settings');
    const [paintMode, setPaintMode] = useState<'brush' | 'bucket' | 'erase'>('brush');
    const [paintColor, setPaintColor] = useState('#8A2BE2');
    const [paintIcon, setPaintIcon] = useState<string | null>(null);
    const [pathDrawingId, setPathDrawingId] = useState<string | null>(null);

    const [manualIconColor, setManualIconColor] = useState('#E0D6F0');
    const [isIconColorAuto, setIsIconColorAuto] = useState(true);
    const [finalIconColor, setFinalIconColor] = useState('#E0D6F0');
    
    const [allDungeons, setAllDungeons] = useState<Dungeon[]>([]);
    const [allFactions, setAllFactions] = useState<Faction[]>([]);
    const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
    const [allCities, setAllCities] = useState<City[]>([]);
    
    const [isAltPressed, setIsAltPressed] = useState(false);
    const [isEyedropperActive, setIsEyedropperActive] = useState(false);

    const { toast } = useToast();
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Alt') {
                e.preventDefault();
                setIsAltPressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Alt') setIsAltPressed(false);
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

        if (currentSelectedId && !sortedMaps.some(m => m.id === currentSelectedId)) {
            setSelectedMapId(sortedMaps.length > 0 ? sortedMaps[0].id : null);
        } else if (!currentSelectedId && sortedMaps.length > 0) {
            setSelectedMapId(sortedMaps[0].id);
        } else if (sortedMaps.length === 0) {
            setSelectedMapId(null);
            setActiveMap(null);
        }
    }, [selectedMapId]);
    
    useEffect(() => {
        loadAllMaps();
        getAllDungeons().then(setAllDungeons);
        getAllFactions().then(setAllFactions);
        getAllCalendarEvents().then(setAllEvents);
        getAllCities().then(setAllCities);
    }, []);
    
    const handleMapsUpdate = (newMapId?: string) => {
        loadAllMaps(newMapId);
    };
    
    useEffect(() => {
        if (selectedMapId) {
            getMapById(selectedMapId).then(mapData => {
                if (mapData) setActiveMap(mapData);
            });
            setSelectedHex(null); 
            setPathDrawingId(null);
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
    
    const handleMapUpdate = useCallback((updatedMap: WorldMap) => {
        setActiveMap(updatedMap);
        updateMap(updatedMap).catch(() => {
            toast({ variant: 'destructive', title: 'Auto-save failed.' });
        });
    }, [toast]);

    const handleGridUpdate = useCallback((newGrid: HexTile[]) => {
        if (activeMap) {
            handleMapUpdate({ ...activeMap, tiles: newGrid });
        }
    }, [activeMap, handleMapUpdate]);
    
    const handleUpdateCityLinks = useCallback(async (currentHex: Hex, newCityIdsForTile: string[]) => {
        if (!activeMap) return;

        const currentTile = activeMap.tiles.find(t => t.hex.q === currentHex.q && t.hex.r === currentHex.r);
        if (!currentTile) return;

        const oldCityIdsOnTile = new Set(currentTile.data.cityIds || []);
        const newCityIdsOnTile = new Set(newCityIdsForTile);
        
        const citiesAdded = newCityIdsForTile.filter(id => !oldCityIdsOnTile.has(id));
        const citiesRemoved = Array.from(oldCityIdsOnTile).filter(id => !newCityIdsOnTile.has(id));

        const cityUpdates = [];
        const mapTileUpdates = new Map<string, { q: number; r: number; cityIds: string[] }>();
        
        for (const cityId of citiesRemoved) {
            const city = allCities.find(c => c.id === cityId);
            if (city) {
                cityUpdates.push(updateCity({ ...city, location: undefined }));
            }
        }

        for (const cityId of citiesAdded) {
            const city = allCities.find(c => c.id === cityId);
            if (!city) continue;

            if (city.location && city.location.mapId === activeMap.id) {
                const oldHexKey = `${city.location.hex.q},${city.location.hex.r}`;
                if (!mapTileUpdates.has(oldHexKey)) {
                    const oldTile = activeMap.tiles.find(t => t.hex.q === city.location!.hex.q && t.hex.r === city.location!.hex.r);
                    mapTileUpdates.set(oldHexKey, { q: city.location.hex.q, r: city.location.hex.r, cityIds: (oldTile?.data.cityIds || []) });
                }
                const update = mapTileUpdates.get(oldHexKey)!;
                update.cityIds = update.cityIds.filter(id => id !== cityId);
            }

            cityUpdates.push(updateCity({ ...city, location: { mapId: activeMap.id, hex: currentHex } }));
        }

        const currentHexKey = `${currentHex.q},${currentHex.r}`;
        if (!mapTileUpdates.has(currentHexKey)) {
            mapTileUpdates.set(currentHexKey, { q: currentHex.q, r: currentHex.r, cityIds: (currentTile.data.cityIds || []) });
        }
        mapTileUpdates.get(currentHexKey)!.cityIds = newCityIdsForTile;

        const newTiles = activeMap.tiles.map(tile => {
            const key = `${tile.hex.q},${tile.hex.r}`;
            if (mapTileUpdates.has(key)) {
                return { ...tile, data: { ...tile.data, cityIds: mapTileUpdates.get(key)!.cityIds } };
            }
            return tile;
        });

        await Promise.all(cityUpdates);
        handleMapUpdate({ ...activeMap, tiles: newTiles });
        getAllCities().then(setAllCities);
    }, [activeMap, allCities, handleMapUpdate]);

    const handleUpdateTileData = (hex: Hex, updates: Partial<HexTile['data']>) => {
        if (activeMap) {
            const newTiles = activeMap.tiles.map(tile => {
                if (tile.hex.q === hex.q && tile.hex.r === hex.r) {
                    return { ...tile, data: { ...tile.data, ...updates } };
                }
                return tile;
            });
            handleMapUpdate({ ...activeMap, tiles: newTiles });
        }
    };
    
    const handlePathUpdate = useCallback((newPaths: Path[]) => {
        if (activeMap) {
            handleMapUpdate({ ...activeMap, paths: newPaths });
        }
    }, [activeMap, handleMapUpdate]);
    
    const handleAddPointToPath = useCallback((point: {x: number, y: number}) => {
        if (!activeMap || !pathDrawingId) return;
        const updatedPaths = (activeMap.paths || []).map(path => {
            if (path.id === pathDrawingId) {
                return { ...path, points: [...path.points, point] };
            }
            return path;
        });
        handlePathUpdate(updatedPaths);
    }, [activeMap, pathDrawingId, handlePathUpdate]);
    
    return (
        <MainLayout>
            <div className="w-full h-full bg-background relative">
                {activeMap ? (
                    <HexGrid 
                        mapData={activeMap}
                        hexSize={25} 
                        className={cn("w-full h-full", (isEyedropperActive || (isAltPressed && activeTool === 'paint' && paintMode === 'brush')) && 'cursor-crosshair')} 
                        style={{ touchAction: 'none' }}
                        onGridUpdate={handleGridUpdate}
                        onHexClick={setSelectedHex}
                        onAddPointToPath={handleAddPointToPath}
                        activeTool={activeTool}
                        paintMode={paintMode}
                        paintColor={paintColor}
                        paintIcon={paintIcon}
                        paintIconColor={finalIconColor}
                        selectedHex={selectedHex}
                        isCtrlPressed={false}
                        isAltPressed={isAltPressed}
                        isShiftPressed={false}
                        isEyedropperActive={isEyedropperActive}
                        onEyedropperClick={handleEyedropperClick}
                        pathDrawingId={pathDrawingId}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <p>Select a map to begin, or create a new one.</p>
                    </div>
                )}

                <MapToolsPanel
                    maps={maps}
                    selectedMapId={selectedMapId}
                    setSelectedMapId={setSelectedMapId}
                    activeMap={activeMap}
                    handleMapsUpdate={handleMapsUpdate}
                    handleMapUpdate={handleMapUpdate}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    paintMode={paintMode}
                    setPaintMode={setPaintMode}
                    paintColor={paintColor}
                    setPaintColor={setPaintColor}
                    isEyedropperActive={isEyedropperActive}
                    setIsEyedropperActive={setIsEyedropperActive}
                    isIconColorAuto={isIconColorAuto}
                    setIsIconColorAuto={setIsIconColorAuto}
                    manualIconColor={manualIconColor}
                    setManualIconColor={setManualIconColor}
                    paintIcon={paintIcon}
                    setPaintIcon={setPaintIcon}
                    pathDrawingId={pathDrawingId}
                    setPathDrawingId={setPathDrawingId}
                    handlePathUpdate={handlePathUpdate}
                    selectedHex={selectedHex}
                    allDungeons={allDungeons}
                    allFactions={allFactions}
                    allCities={allCities}
                    allEvents={allEvents}
                    handleUpdateTileData={handleUpdateTileData}
                    handleUpdateCityLinks={handleUpdateCityLinks}
                />
            </div>
        </MainLayout>
    );
}
