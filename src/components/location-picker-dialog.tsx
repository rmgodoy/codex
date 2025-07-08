
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllMaps, getMapById } from '@/lib/idb';
import type { Map as WorldMap, Hex } from '@/lib/types';
import HexGrid from '@/components/hexgrid/HexGrid';

interface LocationPickerDialogProps {
    children: React.ReactNode;
    onLocationSelect: (location: { mapId: string; hex: Hex }) => void;
}

export function LocationPickerDialog({ children, onLocationSelect }: LocationPickerDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [maps, setMaps] = useState<WorldMap[]>([]);
    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
    const [activeMap, setActiveMap] = useState<WorldMap | null>(null);
    const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
    
    useEffect(() => {
        if (isOpen) {
            getAllMaps().then(maps => {
                setMaps(maps);
                if (maps.length > 0) {
                    setSelectedMapId(maps[0].id);
                }
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedMapId) {
            getMapById(selectedMapId).then(mapData => {
                setActiveMap(mapData || null);
                setSelectedHex(null); // Reset hex when map changes
            });
        } else {
            setActiveMap(null);
        }
    }, [selectedMapId]);
    
    const handleConfirm = () => {
        if (selectedMapId && selectedHex) {
            onLocationSelect({ mapId: selectedMapId, hex: selectedHex });
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select a Location</DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-4 p-4 border-b">
                    <Select value={selectedMapId || ''} onValueChange={setSelectedMapId}>
                        <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select a map..."/></SelectTrigger>
                        <SelectContent>
                            {maps.map(map => <SelectItem key={map.id} value={map.id}>{map.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex-1 text-right text-sm text-muted-foreground">
                        {selectedHex ? `Selected: Q:${selectedHex.q}, R:${selectedHex.r}` : 'Click a tile to select it'}
                    </div>
                </div>
                <div className="flex-1 relative bg-background/50">
                    {activeMap ? (
                        <HexGrid
                            grid={activeMap.tiles}
                            hexSize={20}
                            className="w-full h-full"
                            onHexClick={setSelectedHex}
                            selectedHex={selectedHex}
                            onGridUpdate={() => {}}
                            onHexHover={() => {}}
                            activeTool="data"
                            paintMode="brush"
                            paintColor=""
                            paintIcon={null}
                            paintIconColor=""
                            isCtrlPressed={false}
                            isEyedropperActive={false}
                            onEyedropperClick={() => {}}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <p>Select a map to view it.</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!selectedHex}>Confirm Location</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
