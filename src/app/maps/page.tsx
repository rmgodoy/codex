
"use client";

import React, { useMemo } from 'react';
// react-hexgrid does not have official TypeScript definitions.
// @ts-ignore
import { HexGrid, Hexagon, GridGenerator } from 'react-hexgrid';
import MainLayout from "@/components/main-layout";

export default function MapsPage() {
  const hexagons = useMemo(() => GridGenerator.hexagon(20), []);

  return (
    <MainLayout showSidebarTrigger={false}>
      <div className="w-full h-full hexgrid-container">
        {/*
          The HexGrid component handles panning and zooming.
          We are rendering Hexagon components directly without a Layout component
          to avoid a legacy React context API issue in that specific component.
          The HexGrid should be able to position the Hexagons based on their q,r,s props.
        */}
        <HexGrid width="100%" height="100%">
          {hexagons.map((hex: any, i: number) => (
            <Hexagon key={i} q={hex.q} r={hex.r} s={hex.s} />
          ))}
        </HexGrid>
      </div>
    </MainLayout>
  );
}
