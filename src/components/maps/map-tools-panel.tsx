
"use client";

import { useState, useEffect } from 'react';
import type { Hex, HexTile, Dungeon, Faction, Map as WorldMap, CalendarEvent, Path, City } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsToolPanel from './settings-tool-panel';
import PaintToolPanel from './paint-tool-panel';
import PathToolPanel from './path-tool-panel';
import DataToolPanel from './data-tool-panel';

interface MapToolsPanelProps {
    maps: WorldMap[];
    selectedMapId: string | null;
    setSelectedMapId: (id: string | null) => void;
    activeMap: WorldMap | null;
    handleMapsUpdate: (newMapId?: string) => void;
    handleMapUpdate: (updatedMap: WorldMap) => void;
    activeTool: 'settings' | 'paint' | 'path' | 'data';
    setActiveTool: (tool: 'settings' | 'paint' | 'path' | 'data') => void;
    paintMode: 'brush' | 'bucket' | 'erase';
    setPaintMode: (mode: 'brush' | 'bucket' | 'erase') => void;
    paintColor: string;
    setPaintColor: (color: string) => void;
    isEyedropperActive: boolean;
    setIsEyedropperActive: (isActive: boolean) => void;
    isIconColorAuto: boolean;
    setIsIconColorAuto: (isAuto: boolean) => void;
    manualIconColor: string;
    setManualIconColor: (color: string) => void;
    paintIcon: string | null;
    setPaintIcon: (icon: string | null) => void;
    pathDrawingId: string | null;
    setPathDrawingId: (id: string | null) => void;
    handlePathUpdate: (paths: Path[]) => void;
    selectedHex: Hex | null;
    allDungeons: Dungeon[];
    allFactions: Faction[];
    allCities: City[];
    allEvents: CalendarEvent[];
    handleUpdateTileData: (hex: Hex, updates: Partial<HexTile['data']>) => void;
    handleUpdateCityLinks: (hex: Hex, cityIds: string[]) => void;
}

export default function MapToolsPanel(props: MapToolsPanelProps) {
    const isMobile = useIsMobile();
    const [isToolsOpen, setIsToolsOpen] = useState(!isMobile);

    useEffect(() => {
        setIsToolsOpen(!isMobile);
    }, [isMobile]);

    return (
        <Collapsible
            open={isMobile ? isToolsOpen : true}
            onOpenChange={isMobile ? setIsToolsOpen : undefined}
            className="fixed z-10 w-80 shadow-lg top-20 left-4"
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">Map Tools</CardTitle>
                        {isMobile && (
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ChevronsUpDown className="h-4 w-4" />
                                    <span className="sr-only">Toggle tools panel</span>
                                </Button>
                            </CollapsibleTrigger>
                        )}
                    </div>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent>
                        <Tabs value={props.activeTool} onValueChange={(value) => props.setActiveTool(value as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="settings">Settings</TabsTrigger>
                                <TabsTrigger value="paint">Paint</TabsTrigger>
                                <TabsTrigger value="path">Path</TabsTrigger>
                                <TabsTrigger value="data">Data</TabsTrigger>
                            </TabsList>
                            <TabsContent value="settings" className="mt-4 space-y-4">
                                <SettingsToolPanel {...props} />
                            </TabsContent>
                            <TabsContent value="paint" className="mt-4">
                                <PaintToolPanel {...props} />
                            </TabsContent>
                            <TabsContent value="path" className="mt-4">
                                <PathToolPanel 
                                    activeMap={props.activeMap} 
                                    onPathUpdate={props.handlePathUpdate} 
                                    pathDrawingId={props.pathDrawingId} 
                                    setPathDrawingId={props.setPathDrawingId}
                                />
                            </TabsContent>
                            <TabsContent value="data" className="mt-4">
                                <DataToolPanel {...props} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
