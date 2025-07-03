
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ReactFlow, { MiniMap, Controls, Background, Node, Edge, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { HexNode } from './hex-node';
import { getMapById, addMap, updateMap } from '@/lib/idb';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import type { MapData, HexTile, NewMapData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

const nodeTypes = {
  hex: HexNode,
};

const mapSchema = z.object({
  name: z.string().min(1, "Map name is required"),
  description: z.string().optional(),
  width: z.coerce.number().min(3).max(50),
  height: z.coerce.number().min(3).max(50),
});

type MapFormData = z.infer<typeof mapSchema>;

interface MapEditorViewProps {
  mapId: string | null;
  isCreatingNew: boolean;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onEditCancel: () => void;
  onSelectTile: (id: string | null) => void;
}

const hexWidth = 100;
const hexHeight = 86.6;

const MapEditorComponent = ({ mapId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onSelectTile }: MapEditorViewProps) => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const { toast } = useToast();

  const form = useForm<MapFormData>({
    resolver: zodResolver(mapSchema),
    defaultValues: { name: "", description: "", width: 10, height: 10 },
  });

  useEffect(() => {
    const fetchMap = async () => {
      if (mapId) {
        const data = await getMapById(mapId);
        setMapData(data || null);
      } else {
        setMapData(null);
      }
    };
    if (!isCreatingNew) {
      fetchMap();
    }
  }, [mapId, isCreatingNew]);

  useEffect(() => {
    if (mapData) {
      const newNodes = mapData.tiles.map(tile => {
        const x = tile.q * hexWidth * 0.75;
        const y = (tile.r * hexHeight) + (tile.q * hexHeight / 2);
        return {
          id: tile.id,
          type: 'hex',
          position: { x, y },
          data: {
            color: tile.color,
            icon: tile.icon,
            width: hexWidth,
            height: hexHeight
          },
          draggable: false,
        };
      });
      setNodes(newNodes);
    } else {
      setNodes([]);
    }
  }, [mapData]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onSelectTile(node.id);
  }, [onSelectTile]);
  
  const onPaneClick = useCallback(() => {
    onSelectTile(null);
  }, [onSelectTile]);

  const handleCreateMap = async (data: MapFormData) => {
    try {
      const tiles: HexTile[] = [];
      for (let r = 0; r < data.height; r++) {
        const r_offset = Math.floor(r/2);
        for (let q = -r_offset; q < data.width - r_offset; q++) {
          const s = -q - r;
          tiles.push({ id: `${q},${r},${s}`, q, r, s });
        }
      }
      
      const newMap: NewMapData = { ...data, description: data.description || '', tags: [], tiles, width: data.width, height: data.height };
      const newId = await addMap(newMap);
      toast({ title: "Map Created", description: `${data.name} has been created.` });
      onSaveSuccess(newId);
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Could not create map." });
    }
  };

  if (isCreatingNew) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-lg mx-auto">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Map</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateMap)} className="space-y-4">
                <FormField name="name" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="description" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="width" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Width</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="height" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Height</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
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

  if (!mapData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-xl text-muted-foreground">Select a map to view</p>
          <p className="text-muted-foreground">or create a new one.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-muted/30">
      <ReactFlow
        nodes={nodes}
        onNodesChange={() => {}}
        edges={[]}
        onEdgesChange={() => {}}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodesConnectable={false}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
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
