
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import type { MapData, HexTile } from "@/lib/types";
import { TILE_ICON_NAMES } from "@/lib/map-data";
import { useDebounce } from "@/hooks/use-debounce";

const tileSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  dungeonIds: z.array(z.string()).optional(),
});

type TileFormData = z.infer<typeof tileSchema>;

interface TileEditorPanelProps {
  map: MapData;
  tileId: string;
  onBack: () => void;
  onSave: () => void;
  onMapUpdate: (updatedMap: MapData) => void;
}

export default function TileEditorPanel({ map, tileId, onBack, onSave, onMapUpdate }: TileEditorPanelProps) {
  const tile = map.tiles.find(t => t.id === tileId);

  const form = useForm<TileFormData>({
    resolver: zodResolver(tileSchema),
    defaultValues: {
      title: tile?.title || "",
      description: tile?.description || "",
      color: tile?.color || "#6B7280",
      icon: tile?.icon || "none",
      dungeonIds: tile?.dungeonIds || [],
    },
  });

  const watchedValues = form.watch();
  const debouncedWatchedValues = useDebounce(watchedValues, 50);

  useEffect(() => {
    if (tile) {
      form.reset({
        title: tile.title || "",
        description: tile.description || "",
        color: tile.color || "#6B7280",
        icon: tile.icon || "none",
        dungeonIds: tile.dungeonIds || [],
      });
    }
  }, [tileId, map, form]);

  useEffect(() => {
    const updatedTileData = { ...debouncedWatchedValues };
    const newTiles = map.tiles.map(t => {
      if (t.id === tileId) {
        return { 
          ...t, 
          ...updatedTileData,
          icon: updatedTileData.icon === "none" ? undefined : updatedTileData.icon,
        };
      }
      return t;
    });
    onMapUpdate({ ...map, tiles: newTiles });
  }, [debouncedWatchedValues, onMapUpdate]);


  const onSubmit = (data: TileFormData) => {
    onSave();
  };

  if (!tile) {
    return (
      <div className="p-4">
        <Button onClick={onBack} variant="ghost"><ArrowLeft className="mr-2" /> Back to Map List</Button>
        <p className="text-muted-foreground mt-4">Tile not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Button onClick={onBack} variant="ghost" size="icon" className="-ml-2">
          <ArrowLeft />
        </Button>
        <div>
          <h2 className="text-lg font-bold">Edit Tile</h2>
          <p className="text-sm text-muted-foreground">Coordinates: {tileId}</p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <FormField name="title" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl></FormItem>
            )} />
            <FormField name="color" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Color</FormLabel><FormControl><Input type="color" {...field} /></FormControl></FormItem>
            )} />
            <FormField name="icon" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || "none"}
                >
                  <FormControl><SelectTrigger><SelectValue placeholder="Select an icon" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {TILE_ICON_NAMES.map(iconName => (
                      <SelectItem key={iconName} value={iconName} className="capitalize">{iconName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            {/* Dungeon linking would go here */}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit">Save Map</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
