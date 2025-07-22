
"use client";

import { useState, useEffect } from 'react';
import type { Map as WorldMap, HexTile } from "@/lib/types";
import { resizeHexGrid, generateRectangularHexGrid } from "@/lib/hex-utils";
import { updateMap } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MapManagementDialog from "@/components/maps/map-management-dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

interface SettingsToolPanelProps {
    maps: WorldMap[];
    selectedMapId: string | null;
    setSelectedMapId: (id: string | null) => void;
    activeMap: WorldMap | null;
    handleMapsUpdate: (newMapId?: string) => void;
    handleMapUpdate: (updatedMap: WorldMap) => void;
}

export default function SettingsToolPanel({ maps, selectedMapId, setSelectedMapId, activeMap, handleMapsUpdate, handleMapUpdate }: SettingsToolPanelProps) {
    const [mapSettings, setMapSettings] = useState<{name: string, shape: 'radial' | 'rectangular', radius: number, width: number, height: number} | null>(null);
    const { toast } = useToast();
    
    useEffect(() => {
        if (activeMap) {
            setMapSettings({ 
                name: activeMap.name, 
                shape: activeMap.shape || 'radial', 
                radius: activeMap.radius || 20, 
                width: activeMap.width || 30,
                height: activeMap.height || 20
            });
        } else {
            setMapSettings(null);
        }
    }, [activeMap]);
    
    const handleSaveMapSettings = async () => {
        if (!activeMap || !mapSettings) return;

        if (!mapSettings.name.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Map name cannot be empty.' });
            return;
        }

        let newGrid: HexTile[];
        let updatedMap: WorldMap;

        if (mapSettings.shape === 'radial') {
             if (isNaN(mapSettings.radius) || mapSettings.radius <= 0 || mapSettings.radius > 100) {
                toast({ variant: 'destructive', title: 'Validation Error', description: 'Radius must be a number between 1 and 100.' });
                return;
            }
            newGrid = resizeHexGrid(activeMap.tiles, mapSettings.radius);
            updatedMap = { ...activeMap, name: mapSettings.name, shape: 'radial', radius: mapSettings.radius, width: undefined, height: undefined, tiles: newGrid };
        } else { // rectangular
             if (isNaN(mapSettings.width) || mapSettings.width <= 0 || mapSettings.width > 200 || isNaN(mapSettings.height) || mapSettings.height <= 0 || mapSettings.height > 200) {
                toast({ variant: 'destructive', title: 'Validation Error', description: 'Width and Height must be between 1 and 200.' });
                return;
            }
            newGrid = generateRectangularHexGrid(mapSettings.width, mapSettings.height, activeMap.tiles);
            updatedMap = { ...activeMap, name: mapSettings.name, shape: 'rectangular', width: mapSettings.width, height: mapSettings.height, radius: undefined, tiles: newGrid };
        }
        
        try {
            await updateMap(updatedMap);
            handleMapUpdate(updatedMap); // This will update the activeMap state in the parent
            toast({ title: 'Map settings saved!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save failed' });
        }
    };

    return (
        <div className="space-y-4">
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
            {activeMap && mapSettings ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="map-name">Map Name</Label>
                        <Input id="map-name" value={mapSettings.name} onChange={(e) => setMapSettings(s => s ? {...s, name: e.target.value} : null)} />
                    </div>
                     <div className="space-y-2">
                        <Label>Shape</Label>
                        <RadioGroup value={mapSettings.shape} onValueChange={(v) => setMapSettings(s => s ? { ...s, shape: v as any } : null)} className="flex gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="radial" id="edit-radial" /><Label htmlFor="edit-radial">Radial</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="rectangular" id="edit-rectangular" /><Label htmlFor="edit-rectangular">Rectangular</Label></div>
                        </RadioGroup>
                    </div>
                    {mapSettings.shape === 'radial' ? (
                        <div className="space-y-2">
                            <Label htmlFor="map-radius">Map Radius</Label>
                            <Input id="map-radius" type="number" value={mapSettings.radius} onChange={(e) => setMapSettings(s => s ? {...s, radius: parseInt(e.target.value) || 0} : null)} min="1" max="100" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-2">
                                <Label htmlFor="map-width">Width</Label>
                                <Input id="map-width" type="number" value={mapSettings.width} onChange={(e) => setMapSettings(s => s ? {...s, width: parseInt(e.target.value) || 0} : null)} min="1" max="200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="map-height">Height</Label>
                                <Input id="map-height" type="number" value={mapSettings.height} onChange={(e) => setMapSettings(s => s ? {...s, height: parseInt(e.target.value) || 0} : null)} min="1" max="200" />
                            </div>
                        </div>
                    )}
                    <Button onClick={handleSaveMapSettings} className="w-full">Save Settings</Button>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center pt-4">Select a map to view its settings, or create a new one.</p>
            )}
        </div>
    );
}
