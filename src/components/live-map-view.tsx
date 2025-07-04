
"use client";

import { useEffect, useState } from "react";
import { getMapById } from "@/lib/idb";
import type { MapData } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactFlow from "reactflow";

interface LiveMapViewProps {
  mapId: string;
}

export default function LiveMapView({ mapId }: LiveMapViewProps) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMap = async () => {
      setLoading(true);
      const data = await getMapById(mapId);
      setMapData(data || null);
      setLoading(false);
    };
    fetchMap();
  }, [mapId]);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center"><Skeleton className="w-48 h-48" /></div>;
  }
  
  if (!mapData) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-destructive">Map not found</h2>
        <Link href="/maps" passHref>
          <Button variant="link" className="mt-4"><ArrowLeft className="mr-2"/> Back to Maps</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
       <header className="absolute top-0 left-0 p-4 z-10">
         <Link href="/maps" passHref>
           <Button variant="secondary"><ArrowLeft className="mr-2"/> Back to Editor</Button>
         </Link>
       </header>
       <ReactFlow nodes={[]} edges={[]} fitView>
         <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl font-bold">{mapData.name} - Live Mode Placeholder</h1>
         </div>
       </ReactFlow>
    </div>
  );
}
