
"use client";

import { useMemo } from 'react';
import type { Hex, HexTile, Dungeon, Faction, Map as WorldMap, CalendarEvent, City } from "@/lib/types";
import { format } from "date-fns";
import { useWorld } from "@/components/world-provider";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Building, MapPin, Users, Calendar as CalendarIcon, Link as LinkIcon } from "lucide-react";
import { MultiItemSelectionDialog } from "@/components/multi-item-selection-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { customDateToDate } from './custom-date-converter';

interface DataToolPanelProps {
    activeMap: WorldMap | null;
    selectedHex: Hex | null;
    allDungeons: Dungeon[];
    allFactions: Faction[];
    allCities: City[];
    allEvents: CalendarEvent[];
    handleUpdateTileData: (hex: Hex, updates: Partial<HexTile['data']>) => void;
    handleUpdateCityLinks: (hex: Hex, cityIds: string[]) => void;
}

export default function DataToolPanel(props: DataToolPanelProps) {
    const { worldSlug } = useWorld();
    const { activeMap, selectedHex, allDungeons, allFactions, allCities, allEvents, handleUpdateTileData, handleUpdateCityLinks } = props;

    const selectedTile = useMemo(() => activeMap?.tiles.find(t => t.hex.q === selectedHex?.q && t.hex.r === selectedHex?.r), [activeMap, selectedHex]);
    const dungeonMap = useMemo(() => new Map(allDungeons.map(d => [d.id, d])), [allDungeons]);
    const factionMap = useMemo(() => new Map(allFactions.map(f => [f.id, f])), [allFactions]);
    const cityMap = useMemo(() => new Map(allCities.map(c => [c.id, c])), [allCities]);

    const eventsForSelectedTile = useMemo(() => {
        if (!selectedTile || !activeMap) return [];
        return allEvents.filter(event => 
            event.location &&
            event.location.mapId === activeMap.id &&
            event.location.hex.q === selectedTile.hex.q &&
            event.location.hex.r === selectedTile.hex.r &&
            event.location.hex.s === selectedTile.hex.s
        );
    }, [selectedTile, activeMap, allEvents]);

    if (!selectedHex || !selectedTile) {
        return <p className="text-sm text-muted-foreground">Click on a tile to see or edit its data.</p>;
    }

    return (
        <div className="space-y-4">
            <div>
                <p className="font-semibold text-base">Selected Tile</p>
                <p className="text-sm"><span className="font-semibold">Q:</span> {selectedHex.q}, <span className="font-semibold">R:</span> {selectedHex.r}, <span className="font-semibold">S:</span> {selectedHex.s}</p>
            </div>
            <Separator />
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className="flex items-center gap-2"><Building className="h-4 w-4"/>Cities</Label>
                    <MultiItemSelectionDialog
                        title="Link Cities"
                        items={allCities}
                        initialSelectedIds={selectedTile.data.cityIds || []}
                        onConfirm={(ids) => handleUpdateCityLinks(selectedHex, ids)}
                        trigger={<Button size="sm" variant="outline"><LinkIcon className="h-4 w-4"/></Button>}
                    />
                </div>
                <div className="flex flex-wrap gap-1">
                    {(selectedTile.data.cityIds || []).map(id => <a key={id} href={`#/${worldSlug}/cities/${id}`}><Badge variant="secondary" className="hover:bg-accent/50">{cityMap.get(id)?.name}</Badge></a>)}
                </div>
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
                    {(selectedTile.data.dungeonIds || []).map(id => <a key={id} href={`#/${worldSlug}/dungeons/${id}`}><Badge variant="secondary" className="hover:bg-accent/50">{dungeonMap.get(id)?.name}</Badge></a>)}
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
                    {(selectedTile.data.factionIds || []).map(id => <a key={id} href={`#/${worldSlug}/factions/${id}`}><Badge variant="secondary" className="hover:bg-accent/50">{factionMap.get(id)?.name}</Badge></a>)}
                </div>
            </div>
            <Separator />
            <div className="space-y-2">
                <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/>Events</Label>
                {eventsForSelectedTile.length > 0 ? (
                    <div className="flex flex-col gap-1 text-xs">
                        {eventsForSelectedTile.map(event => {
                             try {
                                return (
                                    <div key={event.id} className="p-1 rounded bg-muted/50">
                                        <p className="font-semibold text-sm">{event.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(customDateToDate(event.startDate), 'P')} - {format(customDateToDate(event.endDate), 'P')}
                                        </p>
                                    </div>
                                );
                            } catch (error) {
                                console.error("Error formatting date for event:", event, error);
                                return (
                                    <div key={event.id} className="p-1 rounded bg-destructive/20">
                                        <p className="font-semibold text-sm text-destructive-foreground">{event.title}</p>
                                        <p className="text-xs text-destructive-foreground">Invalid date format</p>
                                    </div>
                                );
                            }
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">No events linked to this tile.</p>
                )}
            </div>
        </div>
    );
}
