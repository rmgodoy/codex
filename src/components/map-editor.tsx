
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { HexGrid, Layout, Hexagon } from 'react-hexgrid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { produce } from 'immer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TILE_ICON_NAMES, getIconSVG } from '@/lib/map-data';
import type { MapData } from '@/lib/types';
import { updateMap } from '@/lib/idb';
import { useDebounce } from '@/hooks/use-debounce';
import { Paintbrush, Spline, Milestone } from 'lucide-react';

const HEX_SIZE = 50;
type Tool = 'brush' | 'bucket' | 'data';

interface MapEditorProps {
    initialMapData: MapData;
}

export default function MapEditor({ initialMapData }: MapEditorProps) {
    const [mapData, setMapData] = useState(initialMapData);
    const [lastSavedData, setLastSavedData] = useState(initialMapData);
    const debouncedMapData = useDebounce(mapData, 1000);

    const [activeTool, setActiveTool] = useState<Tool>('brush');
    const [brush, setBrush] = useState({ color: '#68B35A', icon: 'none' });
    const [isPainting, setIsPainting] = useState(false);
    
    useEffect(() => {
        if (debouncedMapData && JSON.stringify(debouncedMapData) !== JSON.stringify(lastSavedData)) {
            updateMap(debouncedMapData);
            setLastSavedData(debouncedMapData);
        }
    }, [debouncedMapData, lastSavedData]);

    const handleHexInteraction = (q: number, r: number, s: number) => {
        if (activeTool === 'data') return;

        if (activeTool === 'brush') {
            setMapData(currentMapData => produce(currentMapData, draft => {
                const tile = draft.tiles.find(t => t.q === q && t.r === r && t.s === s);
                if (tile) {
                    tile.color = brush.color;
                    tile.icon = brush.icon === 'none' ? undefined : brush.icon;
                }
            }));
        } else if (activeTool === 'bucket') {
            const startTile = mapData.tiles.find(t => t.q === q && t.r === r && t.s === s);
            if (!startTile || (startTile.color === brush.color && (startTile.icon || 'none') === brush.icon)) return;

            const startColor = startTile.color || '#cccccc';
            const startIcon = startTile.icon;

            const queue = [{q,r,s}];
            const visited = new Set<string>([`${q},${r},${s}`]);
            
            const directions = [[1, -1, 0], [1, 0, -1], [0, 1, -1], [-1, 1, 0], [-1, 0, 1], [0, -1, 1]];

            setMapData(currentMapData => produce(currentMapData, draft => {
                while(queue.length > 0) {
                    const current = queue.shift()!;
                    const tile = draft.tiles.find(t => t.q === current.q && t.r === current.r && t.s === current.s);
                    if (tile) {
                        tile.color = brush.color;
                        tile.icon = brush.icon === 'none' ? undefined : brush.icon;
                    }

                    for (const dir of directions) {
                        const neighborCoord = {q: current.q + dir[0], r: current.r + dir[1], s: current.s + dir[2]};
                        const neighborId = `${neighborCoord.q},${neighborCoord.r},${neighborCoord.s}`;
                        
                        if (!visited.has(neighborId)) {
                            visited.add(neighborId);
                            const neighbor = mapData.tiles.find(t => t.q === neighborCoord.q && t.r === neighborCoord.r && t.s === neighborCoord.s);
                            if (neighbor && (neighbor.color || '#cccccc') === startColor && neighbor.icon === startIcon) {
                                queue.push(neighbor);
                            }
                        }
                    }
                }
            }));
        }
    };

    const handleMouseDown = (event: React.MouseEvent, q: number, r: number, s: number) => {
        if (event.button === 0) { // Left click
            setIsPainting(true);
            handleHexInteraction(q, r, s);
        }
    };

    const handleMouseEnter = (event: React.MouseEvent, q: number, r: number, s: number) => {
        if (isPainting) {
            handleHexInteraction(q, r, s);
        }
    };

    const handleMouseUp = () => setIsPainting(false);

    const radius = mapData.radius || 10;
    const canvasWidth = (radius * 2 + 1) * HEX_SIZE * Math.sqrt(3);
    const canvasHeight = (radius * 2 + 1) * HEX_SIZE * 1.5;

    return (
        <div className="w-full h-full bg-black relative" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onContextMenu={(e) => e.preventDefault()}>
             <TransformWrapper
                panning={{ disabled: isPainting, activationKeys: [], excluded: ["button"], rightMouseButton: true, leftMouseButton: false }}
                wheel={{ step: 0.1 }}
                options={{ minScale: 0.1, maxScale: 8, limitToBounds: false }}
            >
                <TransformComponent wrapperClass="w-full h-full" contentClass="">
                    <HexGrid width={canvasWidth} height={canvasHeight} viewBox={`-50 -50 ${canvasWidth} ${canvasHeight}`}>
                        <Layout size={{ x: HEX_SIZE, y: HEX_SIZE }} flat={false} spacing={1.05} origin={{ x: 0, y: 0 }}>
                            {mapData.tiles.map(tile => (
                                <Hexagon
                                    key={tile.id}
                                    q={tile.q}
                                    r={tile.r}
                                    s={tile.s}
                                    cellStyle={{ fill: tile.color || '#cccccc' }}
                                    onMouseDown={(e) => handleMouseDown(e, tile.q, tile.r, tile.s)}
                                    onMouseEnter={(e) => handleMouseEnter(e, tile.q, tile.r, tile.s)}
                                >
                                    {tile.icon && tile.icon !== 'none' && (
                                        <foreignObject x={-HEX_SIZE/2} y={-HEX_SIZE/2} width={HEX_SIZE} height={HEX_SIZE}>
                                           <img 
                                                xmlns="http://www.w3.org/1999/xhtml"
                                                src={`data:image/svg+xml;base64,${btoa(getIconSVG(tile.icon, '#000000'))}`}
                                                style={{ width: '70%', height: '70%', margin: '15%', objectFit: 'contain', pointerEvents: 'none' }}
                                                alt={tile.icon}
                                            />
                                        </foreignObject>
                                    )}
                                </Hexagon>
                            ))}
                        </Layout>
                    </HexGrid>
                </TransformComponent>
            </TransformWrapper>
            
            <div className="absolute top-4 right-4 w-64 bg-gray-800/80 text-white rounded-lg p-4 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-2">Terrain</h3>
                <Separator className="bg-gray-600 mb-4"/>
                <Label className="text-sm">Terrain Color</Label>
                <Input 
                    type="color" 
                    className="w-full h-10 p-1 bg-gray-700 border-gray-600"
                    value={brush.color} 
                    onChange={e => setBrush(b => ({...b, color: e.target.value}))}
                />
                <ScrollArea className="h-64 mt-4">
                  <div className="grid grid-cols-4 gap-2">
                    {TILE_ICON_NAMES.map(iconName => {
                        const iconSVG = getIconSVG(iconName, '#ffffff');
                        const isSelected = brush.icon === iconName;
                        return (
                          <Button key={iconName} variant="ghost" className={`h-14 w-14 p-0 bg-gray-700/50 hover:bg-gray-600 ${isSelected ? 'ring-2 ring-green-400' : ''}`}
                            onClick={() => setBrush(b => ({...b, icon: iconName}))}
                          >
                            <img src={`data:image/svg+xml;base64,${btoa(iconSVG)}`} className="h-8 w-8" alt={iconName}/>
                          </Button>
                        )
                    })}
                  </div>
                </ScrollArea>
                 <Button variant="ghost" className={`h-14 w-full p-0 mt-2 bg-gray-700/50 hover:bg-gray-600 ${brush.icon === 'none' ? 'ring-2 ring-green-400' : ''}`}
                    onClick={() => setBrush(b => ({...b, icon: 'none'}))}
                  >
                    Clear Icon
                  </Button>
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-800/80 text-white p-2 rounded-full backdrop-blur-sm">
                <Button variant="ghost" size="icon" className={`rounded-full ${activeTool === 'brush' ? 'bg-green-500/50' : ''}`} onClick={() => setActiveTool('brush')} title="Brush Tool"><Paintbrush/></Button>
                <Button variant="ghost" size="icon" className={`rounded-full ${activeTool === 'bucket' ? 'bg-green-500/50' : ''}`} onClick={() => setActiveTool('bucket')} title="Paint Bucket"><Spline/></Button>
                <Separator orientation="vertical" className="h-6 bg-gray-600"/>
                <Button variant="ghost" size="icon" className={`rounded-full ${activeTool === 'data' ? 'bg-green-500/50' : ''}`} onClick={() => setActiveTool('data')} title="Data Tool"><Milestone/></Button>
            </div>

            <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-gray-800/80 p-3 rounded-lg">
                <p><span className="font-bold">Right-Click + Drag:</span> Pan</p>
                <p><span className="font-bold">Scroll Wheel:</span> Zoom</p>
                <p><span className="font-bold">Left Click:</span> Place Terrain</p>
            </div>
        </div>
    );
}
