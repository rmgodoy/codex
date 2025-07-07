
"use client";

import MainLayout from "@/components/main-layout";
import { useMemo } from 'react';
// react-hexgrid does not have official TypeScript definitions.
// @ts-ignore
import { HexGrid, Layout, Hexagon, GridGenerator } from 'react-hexgrid';

export default function MapsPage() {
  const hexagons = useMemo(() => GridGenerator.hexagon(20), []);

  return (
    <MainLayout showSidebarTrigger={false}>
      <div className="w-full h-full hexgrid-container">
        <HexGrid width="100%" height="100%">
          <Layout size={{ x: 7, y: 7 }} flat={false} spacing={1.05} origin={{ x: 0, y: 0 }}>
            {hexagons.map((hex: any, i: number) => (
              <Hexagon key={i} q={hex.q} r={hex.r} s={hex.s} />
            ))}
          </Layout>
        </HexGrid>
      </div>
    </MainLayout>
  );
}
