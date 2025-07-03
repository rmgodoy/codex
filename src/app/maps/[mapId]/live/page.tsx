
"use client";

import LiveMapView from "@/components/live-map-view";

export default function LiveMapPage({ params }: { params: { mapId: string } }) {
  return <LiveMapView mapId={params.mapId} />;
}
