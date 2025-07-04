
"use client";

import React, { useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  MiniMap,
  useStore,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import type { MapData } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertTitle } from './ui/alert-dialog';
import { HexNode } from './hex-node';
import { useDebounce } from '@/hooks/use-debounce';

const nodeTypes = {
  hex: HexNode,
};

const hexGridSize = 70;

const axialToPixel = (q: number, r: number) => {
  const x = hexGridSize * Math.sqrt(3) * (q + r / 2);
  const y = hexGridSize * 3 / 2 * r;
  return { x, y };
};

const mapCreationSchema = z.object({
  name: z.string().min(1, "Map name is required"),
  description: z.string().optional(),
  width: z.coerce.number().min(3).max(1000),
  height: z.coerce.number().min(3).max(1000),
});
type MapCreationFormData = z.infer<typeof mapCreationSchema>;

interface MapEditorViewProps {
  mapData: MapData | null;
  isCreatingNew: boolean;
  isLoading: boolean;
  onNewMapSave: (data: MapCreationFormData) => void;
  onEditCancel: () => void;
  onSelectTile: (id: string | null) => void;
  selectedTileId: string | null;
  onMapSettingsSave: (data: Partial<MapData>) => void;
  isBrushActive: boolean;
  onBrushPaint: (tileId: string) => void;
}

const MapEditorComponent = ({ mapData, isCreatingNew, isLoading, onNewMapSave, onEditCancel, onSelectTile, selectedTileId, onMapSettingsSave, isBrushActive, onBrushPaint }: MapEditorViewProps) => {
  const form = useForm<MapCreationFormData>({
    resolver: zodResolver(mapCreationSchema),
    defaultValues: { name: "", description: "", width: 20, height: 20 },
  });
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [isPainting, setIsPainting] = useState(false);
  
  const { width, height, transform } = useStore(s => ({ width: s.width, height: s.height, transform: s.transform }));
  const debouncedTransform = useDebounce(transform, 100);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) { // Only stop painting for left mouse button release
        setIsPainting(false);
      }
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (mapData?.tiles) {
        const [x, y, zoom] = debouncedTransform;

        const visibleTiles = mapData.tiles.filter(tile => {
            const tileX = hexGridSize * Math.sqrt(3) * (tile.q + tile.r / 2);
            const tileY = hexGridSize * 3 / 2 * tile.r;
            
            const tileWidth = hexGridSize * Math.sqrt(3);
            const tileHeight = hexGridSize * 2;

            return (
                tileX * zoom + x < width &&
                (tileX + tileWidth) * zoom + x > 0 &&
                tileY * zoom + y < height &&
                (tileY + tileHeight) * zoom + y > 0
            );
        });

      const newNodes = visibleTiles.map((tile) => {
        const { x, y } = axialToPixel(tile.q, tile.r);
        return {
          id: tile.id,
          type: 'hex',
          position: { x, y },
          data: {
            color: tile.color,
            icon: tile.icon,
            width: hexGridSize * Math.sqrt(3),
            height: hexGridSize * 2
          },
          selectable: true,
        };
      });
      setNodes(newNodes);
    } else {
      setNodes([]);
    }
  }, [mapData, setNodes, debouncedTransform, width, height]);
  
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        node.selected = node.id === selectedTileId;
        return node;
      })
    );
  }, [selectedTileId, setNodes]);

  const handleNodeMouseDown = (_event: React.MouseEvent, node: Node) => {
    if (isBrushActive && _event.button === 0) { // Only start painting with left click
      setIsPainting(true);
      onBrushPaint(node.id);
    }
  };

  const handleNodeMouseEnter = (_event: React.MouseEvent, node: Node) => {
    if (isPainting && isBrushActive) {
      onBrushPaint(node.id);
    }
  };

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (!isBrushActive && _event.button === 0) { // Only select with left click
      onSelectTile(node.id);
    }
  };


  const MapSettingsDialog = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const settingsForm = useForm<MapCreationFormData>({
      resolver: zodResolver(mapCreationSchema),
      defaultValues: {
        name: mapData?.name,
        description: mapData?.description,
        width: mapData?.width,
        height: mapData?.height,
      },
    });

    const onSubmit = (data: MapCreationFormData) => {
      onMapSettingsSave(data);
      setIsDialogOpen(false);
    };

    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="Map Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Map Settings</DialogTitle></DialogHeader>
           <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="name" control={settingsForm.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="description" control={settingsForm.control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>)} />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button type="button" variant="destructive" className="w-full">Resize Map</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                       <AlertDialogHeader>
                           <AlertTitle>Resize Map?</AlertTitle>
                           <AlertDialogDescription>Warning: Resizing the map will delete all existing tiles and their content. This action cannot be undone. Are you sure you want to proceed?</AlertDialogDescription>
                       </AlertDialogHeader>
                       <div className="grid grid-cols-2 gap-4">
                          <FormField name="width" control={settingsForm.control} render={({ field }) => (<FormItem><FormLabel>Width</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField name="height" control={settingsForm.control} render={({ field }) => (<FormItem><FormLabel>Height</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                       </div>
                       <AlertDialogFooter>
                           <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <AlertDialogAction type="submit">Resize and Overwrite</AlertDialogAction>
                       </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <div className="flex justify-end pt-4">
                  <Button type="submit">Save Settings</Button>
                </div>
              </form>
            </Form>
        </DialogContent>
      </Dialog>
    );
  };

  if (isCreatingNew) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-lg mx-auto">
        <Card>
          <CardHeader><CardTitle>Create New Map</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onNewMapSave)} className="space-y-4">
                <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="width" control={form.control} render={({ field }) => (<FormItem><FormLabel>Width</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField name="height" control={form.control} render={({ field }) => (<FormItem><FormLabel>Height</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={onEditCancel}>Cancel</Button>
                  <Button type="submit">Create Map</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="w-full h-full flex items-center justify-center"><Skeleton className="h-48 w-48" /></div>;
  }
  
  if (!mapData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="p-8 text-center"><p className="text-xl text-muted-foreground">Select a map to view or create a new one.</p></Card>
      </div>
    );
  }

  return (
    <div
        className="w-full h-full bg-muted/30 relative"
    >
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={() => onSelectTile(null)}
        onNodeMouseDown={handleNodeMouseDown}
        onNodeMouseEnter={handleNodeMouseEnter}
        onContextMenu={(e) => e.preventDefault()}
        fitView
        nodesDraggable={false}
        panOnDrag={[2]}
        className="bg-background"
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background variant="dots" gap={16} size={1} />
      </ReactFlow>
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <MapSettingsDialog />
      </div>
    </div>
  );
};

export default function MapEditorView(props: MapEditorViewProps) {
  return <ReactFlowProvider><MapEditorComponent {...props} /></ReactFlowProvider>;
}

    