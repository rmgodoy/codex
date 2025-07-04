
"use client";

import { useState, useEffect } from 'react';
import MainLayout from "@/components/main-layout";
import MapListPanel from '@/components/map-list-panel';
import MapEditor from '@/components/map-editor';
import type { MapData } from '@/lib/types';
import { getMapById, deleteMap } from '@/lib/idb';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function MapsPage() {
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectMap = (id: string | null) => {
    setSelectedMapId(id);
  };
  
  const handleNewMap = () => {
    setSelectedMapId(null);
    refreshList();
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
  
  if (!isClient) return null;

  return (
    <SidebarProvider>
      <MainLayout>
        <div className="flex w-full h-full overflow-hidden">
          <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
              <MapListPanel
                onSelectMap={handleSelectMap}
                onNewMapCreated={handleNewMap}
                selectedMapId={selectedMapId}
                dataVersion={dataVersion}
                onDeleteMap={handleDeleteMap}
              />
          </Sidebar>
          <SidebarInset className="flex-1 bg-black">
            {loading ? (
                <div className="w-full h-full flex items-center justify-center text-white">Loading map...</div>
            ) : selectedMapId && mapData ? (
              <MapEditor key={selectedMapId} initialMapData={mapData} />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Select a map to begin editing.</div>
            )}
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
