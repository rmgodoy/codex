
"use client";

import { useState, useEffect } from 'react';
import MainLayout from "@/components/main-layout";
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import MapListPanel from '@/components/map-list-panel';
import MapEditorView from '@/components/map-editor-view';
import TileEditorPanel from '@/components/tile-editor-panel';
import type { MapData } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { getMapById } from '@/lib/idb';

type SortByType = 'name';

export default function MapsPage() {
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState(0);

  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchMap = async () => {
      if (selectedMapId) {
        const data = await getMapById(selectedMapId);
        setMapData(data || null);
      } else {
        setMapData(null);
      }
    };
    fetchMap();
  }, [selectedMapId, dataVersion]);

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
  };

  const handleSaveSuccess = (id: string) => {
    refreshList();
    if (isCreatingNew) {
      setSelectedMapId(id);
      setIsCreatingNew(false);
    }
  };

  const handleDeleteSuccess = () => {
    refreshList();
    setSelectedMapId(null);
    setSelectedTileId(null);
    setIsCreatingNew(false);
  };

  const handleEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
    }
    if (selectedTileId) {
      setSelectedTileId(null);
    }
  };

  if (!isClient) return null;

  return (
    <SidebarProvider>
      <MainLayout>
        <div className="flex w-full h-full overflow-hidden">
          <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
            {selectedTileId && mapData ? (
              <TileEditorPanel
                map={mapData}
                tileId={selectedTileId}
                onBack={() => setSelectedTileId(null)}
                onSave={refreshList}
              />
            ) : (
              <MapListPanel
                onSelectMap={handleSelectMap}
                onNewMap={handleNewMap}
                selectedMapId={selectedMapId}
                dataVersion={dataVersion}
              />
            )}
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <MapEditorView
              key={selectedMapId ?? (isCreatingNew ? 'new' : 'placeholder')}
              mapId={selectedMapId}
              isCreatingNew={isCreatingNew}
              onSaveSuccess={handleSaveSuccess}
              onDeleteSuccess={handleDeleteSuccess}
              onEditCancel={handleEditCancel}
              onSelectTile={setSelectedTileId}
            />
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
