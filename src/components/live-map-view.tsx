
"use client";

import { useEffect, useState, useMemo } from "react";
import { getMapById, getDungeonById } from "@/lib/idb";
import type { MapData, Dungeon } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MapCanvasComponent from './map-canvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ScrollArea } from "./ui/scroll-area";
import { TILE_ICONS } from "@/lib/map-data";

interface LiveMapViewProps {
  mapId: string;
}

export default function LiveMapView({ mapId }: LiveMapViewProps) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [linkedDungeons, setLinkedDungeons] = useState<Dungeon[]>([]);

  const selectedTile = useMemo(() => {
    if (!mapData || !selectedTileId) return null;
    return mapData.tiles.find(t => t.id === selectedTileId);
  }, [mapData, selectedTileId]);

  useEffect(() => {
    const fetchMap = async () => {
      setLoading(true);
      const data = await getMapById(mapId);
      setMapData(data || null);
      setLoading(false);
    };
    fetchMap();
  }, [mapId]);
  
  useEffect(() => {
    const fetchDungeons = async () => {
        if (selectedTile?.dungeonIds && selectedTile.dungeonIds.length > 0) {
            const dungeons = await Promise.all(
                selectedTile.dungeonIds.map(id => getDungeonById(id))
            );
            setLinkedDungeons(dungeons.filter((d): d is Dungeon => d !== undefined));
        } else {
            setLinkedDungeons([]);
        }
    };
    fetchDungeons();
  }, [selectedTile]);


  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center"><Skeleton className="w-48 h-48" /></div>;
  }
  
  if (!mapData) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-destructive">Map not found</h2>
        <Link href="/maps">
          <Button variant="link" className="mt-4"><ArrowLeft className="mr-2"/> Back to Maps</Button>
        </Link>
      </div>
    );
  }

  const Icon = selectedTile?.icon ? TILE_ICONS[selectedTile.icon as keyof typeof TILE_ICONS] : null;

  return (
    <div className="h-screen w-screen relative">
       <header className="absolute top-4 left-4 z-10">
         <Link href="/maps">
           <Button variant="secondary"><ArrowLeft className="mr-2"/> Back to Editor</Button>
         </Link>
       </header>
       
       {selectedTile && (
         <div className="absolute top-20 left-4 z-10 w-80">
            <Card className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        {Icon && <Icon className="h-8 w-8 text-accent" />}
                        <div>
                            <CardTitle>{selectedTile.title || 'Unnamed Tile'}</CardTitle>
                            <CardDescription>Coordinates: {selectedTile.id}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-96">
                    <p className="text-sm mb-4">{selectedTile.description || 'No description.'}</p>
                    {linkedDungeons.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Linked Dungeons</h4>
                        <ul className="space-y-2">
                          {linkedDungeons.map(dungeon => (
                            <li key={dungeon.id} className="text-sm text-accent">{dungeon.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
            </Card>
         </div>
       )}

       <MapCanvasComponent mapData={mapData} selectedTileId={selectedTileId} onTileClick={setSelectedTileId} />
    </div>
  );
}
