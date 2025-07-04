
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { produce } from 'immer';
import { Hex, Grid, defineHex } from 'honeycomb-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TILE_ICON_NAMES, getIconSVG } from '@/lib/map-data';
import type { MapData, HexTile } from '@/lib/types';
import { updateMap } from '@/lib/idb';
import { useDebounce } from '@/hooks/use-debounce';
import { Paintbrush, Spline, Trash2, Milestone, Hand } from 'lucide-react';

const HEX_SIZE = 50;

type Tool = 'brush' | 'bucket' | 'data';

// Helper function to convert pixel coordinates to hex coordinates
const pixelToHex = (grid: Grid<HexTile>, x: number, y: number): Hex => {
    const point = { x, y };
    return grid.pointToHex(point);
};

interface MapEditorProps {
    initialMapData: MapData;
}

export default function MapEditor({ initialMapData }: MapEditorProps) {
    const [mapData, setMapData] = useState(initialMapData);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeTool, setActiveTool] = useState<Tool>('brush');
    const [brush, setBrush] = useState({ color: '#68B35A', icon: 'none' });
    const [iconImageCache, setIconImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    const debouncedMapData = useDebounce(mapData, 1000);
    const [isPainting, setIsPainting] = useState(false);
    
    const HexWithMetadata = useMemo(() => defineHex<HexTile>({ 
        dimensions: HEX_SIZE, 
        orientation: 'pointy',
        origin: 'center'
    }), []);
    
    const grid = useMemo(() => {
        const tiles = mapData.tiles.map(tile => new HexWithMetadata(tile));
        return new Grid(HexWithMetadata, tiles);
    }, [mapData.tiles, HexWithMetadata]);
    
    // Pre-load icon images
    useEffect(() => {
        const cache = new Map<string, HTMLImageElement>();
        TILE_ICON_NAMES.forEach(iconName => {
            const svgString = getIconSVG(iconName, 'black');
            const img = new Image();
            img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
            img.onload = () => {
                cache.set(iconName, img);
            };
        });
        setIconImageCache(cache);
    }, []);

    // Auto-save debounced data
    useEffect(() => {
        if (debouncedMapData && debouncedMapData !== initialMapData) {
            updateMap(debouncedMapData);
        }
    }, [debouncedMapData, initialMapData]);

    const drawMap = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        grid.forEach(hex => {
            const { x, y } = hex.toPoint();
            const corners = hex.corners();

            ctx.beginPath();
            corners.forEach((corner, i) => {
                const point = { x: corner.x + x, y: corner.y + y };
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.closePath();
            
            ctx.fillStyle = hex.color || '#cccccc';
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            if (hex.icon && iconImageCache.has(hex.icon)) {
                const img = iconImageCache.get(hex.icon)!;
                const iconSize = HEX_SIZE * 0.8;
                ctx.drawImage(img, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize);
            }
        });
    }, [grid, iconImageCache]);
    
    // Draw map whenever the grid changes
    useEffect(() => {
        drawMap();
    }, [drawMap]);
    
    const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (activeTool === 'data') return; // Data tool doesn't paint

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const transform = e.currentTarget.style.transform;
        const matrix = new DOMMatrix(transform);
        
        const scale = matrix.a;
        const panX = matrix.e;
        const panY = matrix.f;
        
        const canvasX = (e.clientX - rect.left - panX) / scale;
        const canvasY = (e.clientY - rect.top - panY) / scale;

        const targetHexCoords = pixelToHex(grid, canvasX, canvasY);

        if (activeTool === 'brush') {
            const targetHex = grid.get(targetHexCoords);
            if (targetHex) {
                setMapData(currentMapData => produce(currentMapData, draft => {
                    const tile = draft.tiles.find(t => t.q === targetHex.q && t.r === targetHex.r);
                    if (tile) {
                        tile.color = brush.color;
                        tile.icon = brush.icon === 'none' ? undefined : brush.icon;
                    }
                }));
            }
        } else if (activeTool === 'bucket') {
            const startHex = grid.get(targetHexCoords);
            if (!startHex || (startHex.color === brush.color && (startHex.icon || 'none') === brush.icon)) return;
            
            const startColor = startHex.color || '#cccccc';
            const startIcon = startHex.icon;

            const queue: Hex[] = [startHex];
            const visited = new Set<string>([startHex.toString()]);
            
            setMapData(currentMapData => produce(currentMapData, draft => {
                while(queue.length > 0) {
                    const current = queue.shift()!;
                    const tile = draft.tiles.find(t => t.q === current.q && t.r === current.r);
                    if (tile) {
                        tile.color = brush.color;
                        tile.icon = brush.icon === 'none' ? undefined : brush.icon;
                    }

                    grid.neighborsOf(current).forEach(neighbor => {
                        if (neighbor && !visited.has(neighbor.toString())) {
                            visited.add(neighbor.toString());
                            if ((neighbor.color || '#cccccc') === startColor && neighbor.icon === startIcon) {
                                queue.push(neighbor);
                            }
                        }
                    });
                }
            }));
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0) { // Left click
            setIsPainting(true);
            handleCanvasInteraction(e);
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isPainting) {
            handleCanvasInteraction(e);
        }
    };

    const handleMouseUp = () => {
        setIsPainting(false);
    };

    return (
        <div className="w-full h-full bg-black flex relative">
             <TransformWrapper
                panning={{ disabled: isPainting, activationKeys: ['Control'], excluded: ["button"] }}
                wheel={{ step: 0.1 }}
                options={{ minScale: 0.1, maxScale: 8 }}
            >
                <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
                    <canvas
                        ref={canvasRef}
                        width={mapData.width * HEX_SIZE * 2}
                        height={mapData.height * HEX_SIZE * 2}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
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
                <p><span className="font-bold">Ctrl + Drag:</span> Pan</p>
                <p><span className="font-bold">Scroll Wheel:</span> Zoom</p>
                <p><span className="font-bold">Left Click:</span> Place Terrain</p>
            </div>
        </div>
    );
}
