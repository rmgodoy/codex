
"use client";

import React, { useState, useCallback } from 'react';
import ReactFlow, { MiniMap, Controls, ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import type { MapData, HexTile } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { HexGridBackground } from './hex-grid-background';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle as AlertTitle } from './ui/alert-dialog';


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
}

const MapEditorComponent = ({ mapData, isCreatingNew, isLoading, onNewMapSave, onEditCancel, onSelectTile, selectedTileId, onMapSettingsSave }: MapEditorViewProps) => {
  const { screenToFlowPosition } = useReactFlow();
  
  const form = useForm<MapCreationFormData>({
    resolver: zodResolver(mapCreationSchema),
    defaultValues: { name: "", description: "", width: 20, height: 20 },
  });
  
  const handlePaneClick = (event: React.MouseEvent) => {
    // Ensure the click is on the pane itself, not on a control or other element
    if (event.target instanceof Element && !event.target.classList.contains('react-flow__pane')) {
        return;
    }

    const { x, y } = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const { q, r } = pixelToAxial(x, y);
    const rounded = hexRound(q, r);
    const s = -rounded.q - rounded.r;
    const tileId = `${rounded.q},${rounded.r},${s}`;

    const clickedTile = mapData?.tiles.find(t => t.id === tileId);
    if (clickedTile) {
        onSelectTile(tileId);
    } else {
        onSelectTile(null);
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
    <div className="w-full h-full bg-muted/30 relative">
      <ReactFlow onPaneClick={handlePaneClick} fitView>
        <HexGridBackground map={mapData} selectedTileId={selectedTileId} hexSize={hexSize} />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>
      <div className="absolute top-4 right-4 flex gap-2">
        <MapSettingsDialog />
      </div>
    </div>
  );
};

export default function MapEditorView(props: MapEditorViewProps) {
  return (
    <ReactFlowProvider>
      <MapEditorComponent {...props} />
    </ReactFlowProvider>
  );
}
