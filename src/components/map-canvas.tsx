
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';
import { Plus, Minus, RefreshCw } from 'lucide-react';
import type { MapData } from '@/lib/types';
import { HexGridBackground } from '@/components/hex-grid-background';

const hexSize = 60;

// Conversion from pixel coordinates (x, y) to fractional axial coordinates for pointy-top hexagons
function pixelToAxial(x: number, y: number) {
  const q = (Math.sqrt(3)/3 * x - 1/3 * y) / hexSize;
  const r = (2/3 * y) / hexSize;
  return { q, r };
}

// Rounding fractional hex coordinates to the nearest integer hex coordinates
function hexRound(q: number, r: number): { q: number; r: number } {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const q_diff = Math.abs(rq - q);
    const r_diff = Math.abs(rr - r);
    const s_diff = Math.abs(rs - s);

    if (q_diff > r_diff && q_diff > s_diff) {
        rq = -rr - rs;
    } else if (r_diff > s_diff) {
        rr = -rq - rs;
    }
    
    return { q: rq, r: rr };
}

interface MapCanvasProps {
  mapData: MapData;
  selectedTileId: string | null;
  onTileClick: (tileId: string | null) => void;
  showControls?: boolean;
}

export default function MapCanvasComponent({ mapData, selectedTileId, onTileClick, showControls = true }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ scale: 1, positionX: 0, positionY: 0 });

  useEffect(() => {
    if (containerRef.current) {
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // This event is on the main container div, which does not pan or zoom.
    const { offsetX, offsetY } = event.nativeEvent;
    
    // Transform viewport coordinates to world coordinates
    const worldX = (offsetX - viewport.positionX) / viewport.scale;
    const worldY = (offsetY - viewport.positionY) / viewport.scale;

    const { q, r } = pixelToAxial(worldX, worldY);
    const rounded = hexRound(q, r);
    const s = -rounded.q - rounded.r;
    const tileId = `${rounded.q},${rounded.r},${s}`;

    const clickedTile = mapData?.tiles.find(t => t.id === tileId);
    onTileClick(clickedTile ? tileId : null);
  }, [mapData, onTileClick, viewport]);

  const worldWidth = mapData ? (mapData.width * hexSize * Math.sqrt(3)) : 10000;
  const worldHeight = mapData ? (mapData.height * hexSize * 1.5) : 10000;

  return (
    <div ref={containerRef} className="w-full h-full bg-muted/30 relative overflow-hidden" onClick={handleCanvasClick}>
      <TransformWrapper
        onTransformed={(ref, state) => setViewport(state)}
        minScale={0.1}
        maxScale={8}
        initialScale={1}
        limitToBounds={false}
        centerOnInit
        panning={{ excluded: ['button'] }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {showControls && (
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button onClick={() => zoomIn()}><Plus /></Button>
                <Button onClick={() => zoomOut()}><Minus /></Button>
                <Button onClick={() => resetTransform()}><RefreshCw /></Button>
              </div>
            )}
            
            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
              <div
                style={{ width: worldWidth, height: worldHeight }}
              />
            </TransformComponent>
            
            {dimensions.width > 0 && mapData && (
              <HexGridBackground
                  map={mapData}
                  selectedTileId={selectedTileId}
                  hexSize={hexSize}
                  viewport={{ x: viewport.positionX, y: viewport.positionY, scale: viewport.scale }}
                  width={dimensions.width}
                  height={dimensions.height}
              />
            )}
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
