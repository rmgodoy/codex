
"use client";

import { useState, useEffect, useCallback } from 'react';
import MainLayout from "@/components/main-layout";
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import MapListPanel from '@/components/map-list-panel';
import MapEditorView from '@/components/map-editor-view';
import TileEditorPanel from '@/components/tile-editor-panel';
import type { MapData, NewMapData, HexTile } from '@/lib/types';
import { getMapById, updateMap, addMap, deleteMap } from '@/lib/idb';
import { useToast } from '@/hooks/use-toast';
import { produce } from 'immer';
import { useDebounce } from '@/hooks/use-debounce';

export default function MapsPage() {
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState(0);

  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const [isBrushActive, setIsBrushActive] = useState(false);
  const [brushSettings, setBrushSettings] = useState({ color: '#cccccc', icon: 'none' });

  const debouncedMapData = useDebounce(mapData, 1000);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchMap = async () => {
      if (selectedMapId) {
        setLoading(true);
        const data = await getMapById(selectedMapId);
        setMapData(data || null);
        setLoading(false);
      } else {
        setMapData(null);
      }
    };
    fetchMap();
  }, [selectedMapId, dataVersion]);

  // Debounced auto-save
  useEffect(() => {
    if (debouncedMapData && !isCreatingNew) {
        updateMap(debouncedMapData).catch(error => {
            toast({ variant: "destructive", title: "Auto-save Failed", description: "Could not save map changes." });
        });
    }
  }, [debouncedMapData, isCreatingNew, toast]);


  const [loading, setLoading] = useState(false);
  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectMap = (id: string | null) => {
    setSelectedMapId(id);
    setSelectedTileId(null);
    setIsCreatingNew(false);
  };

  const handleNewMap = () => {
    setSelectedMapId(null);
    setSelectedTileId(null);
    setIsCreatingNew(true);
    setMapData(null);
  };

  const handleSaveNewMap = async (data: { name: string; description: string; width: number; height: number; }) => {
    try {
      setLoading(true);
      const tiles: HexTile[] = [];
      for (let r = 0; r < data.height; r++) {
        const r_offset = Math.floor(r / 2);
        for (let q = -r_offset; q < data.width - r_offset; q++) {
          const s = -q - r;
          tiles.push({ id: `${q},${r},${s}`, q, r, s, color: '#cccccc' });
        }
      }
      
      const newMap: NewMapData = { ...data, description: data.description || '', tags: [], tiles };
      const newId = await addMap(newMap);
      toast({ title: "Map Created", description: `${data.name} has been created.` });
      
      refreshList();
      setIsCreatingNew(false);
      setSelectedMapId(newId);
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Could not create map." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMap = async (id: string) => {
    try {
      await deleteMap(id);
      toast({ title: "Map Deleted", description: "The map has been removed." });
      if (selectedMapId === id) {
        setSelectedMapId(null);
        setMapData(null);
      }
      refreshList();
    } catch (error) {
       toast({ variant: 'destructive', title: "Error", description: "Could not delete map." });
    }
  };
  
  const handleMapUpdate = (updatedMap: MapData) => {
    setMapData(updatedMap);
  };
  
  const handleMapSettingsSave = async (updatedSettings: Partial<MapData>) => {
    if (!mapData) return;
    
    const didResize = updatedSettings.width && updatedSettings.height && (updatedSettings.width !== mapData.width || updatedSettings.height !== mapData.height);
    
    const nextState = produce(mapData, draft => {
        draft.name = updatedSettings.name ?? draft.name;
        draft.description = updatedSettings.description ?? draft.description;
        
        if (didResize) {
            draft.width = updatedSettings.width!;
            draft.height = updatedSettings.height!;
            const newTiles: HexTile[] = [];
            for (let r = 0; r < draft.height; r++) {
                const r_offset = Math.floor(r / 2);
                for (let q = -r_offset; q < draft.width - r_offset; q++) {
                    const s = -q - r;
                    newTiles.push({ id: `${q},${r},${s}`, q, r, s, color: '#cccccc' });
                }
            }
            draft.tiles = newTiles;
            setSelectedTileId(null); // Deselect tile as grid has changed
        }
    });
    
    setMapData(nextState);

    try {
      await updateMap(nextState);
      toast({ title: "Map Saved", description: "Your changes have been saved." });
      refreshList(); // To update list if name changed
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save map changes." });
      setMapData(mapData); // Revert optimistic update on failure
    }
  };

  const handleTileUpdate = useCallback(async (updatedTile: HexTile) => {
    setMapData(currentMapData => {
      if (!currentMapData) return null;
      
      const nextState = produce(currentMapData, draft => {
        const tileIndex = draft.tiles.findIndex(t => t.id === updatedTile.id);
        if (tileIndex !== -1) {
          draft.tiles[tileIndex] = updatedTile;
        }
      });
      return nextState;
    });
  }, []);

  const handleBrushPaint = useCallback((tileId: string) => {
    setMapData(currentMapData => {
      if (!currentMapData) return null;
      return produce(currentMapData, draft => {
        const tileIndex = draft.tiles.findIndex(t => t.id === tileId);
        if (tileIndex !== -1) {
          const tile = draft.tiles[tileIndex];
          if (tile.color !== brushSettings.color || tile.icon !== (brushSettings.icon === 'none' ? undefined : brushSettings.icon)) {
            tile.color = brushSettings.color;
            tile.icon = brushSettings.icon === 'none' ? undefined : brushSettings.icon;
          }
        }
      });
    });
  }, [brushSettings]);


  if (!isClient) return null;

  return (
    <SidebarProvider>
      <MainLayout>
        <div className="flex w-full h-full overflow-hidden">
          <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
            {selectedMapId && mapData && selectedTileId ? (
              <TileEditorPanel
                key={selectedTileId}
                map={mapData}
                tileId={selectedTileId}
                onBack={() => setSelectedTileId(null)}
                onTileUpdate={handleTileUpdate}
                isBrushActive={isBrushActive}
                onBrushActiveChange={setIsBrushActive}
                onBrushSettingsChange={setBrushSettings}
                brushSettings={brushSettings}
              />
            ) : (
              <MapListPanel
                onSelectMap={handleSelectMap}
                onNewMap={handleNewMap}
                selectedMapId={selectedMapId}
                dataVersion={dataVersion}
                onDeleteMap={handleDeleteMap}
              />
            )}
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <MapEditorView
              key={selectedMapId ?? (isCreatingNew ? 'new' : 'placeholder')}
              mapData={mapData}
              isCreatingNew={isCreatingNew}
              isLoading={loading}
              onNewMapSave={handleSaveNewMap}
              onEditCancel={handleNewMap}
              onSelectTile={setSelectedTileId}
              selectedTileId={selectedTileId}
              onMapSettingsSave={handleMapSettingsSave}
              isBrushActive={isBrushActive}
              onBrushPaint={handleBrushPaint}
            />
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
