
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
import { ArrowLeft, Mountain, Trees, Castle, Tent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateMap } from "@/lib/idb";
import type { MapData, HexTile } from "@/lib/types";
import { TILE_ICON_NAMES } from "@/lib/map-data";

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
}

export default function TileEditorPanel({ map, tileId, onBack, onSave }: TileEditorPanelProps) {
  const { toast } = useToast();
  const tile = map.tiles.find(t => t.id === tileId);

  const form = useForm<TileFormData>({
    resolver: zodResolver(tileSchema),
    defaultValues: {
      title: tile?.title || "",
      description: tile?.description || "",
      color: tile?.color || "#6B7280", // Default to gray
      icon: tile?.icon || "",
      dungeonIds: tile?.dungeonIds || [],
    },
  });

  useEffect(() => {
    const tile = map.tiles.find(t => t.id === tileId);
    if (tile) {
      form.reset({
        title: tile.title || "",
        description: tile.description || "",
        color: tile.color || "#6B7280",
        icon: tile.icon || "",
        dungeonIds: tile.dungeonIds || [],
      });
    }
  }, [tileId, map, form]);

  const onSubmit = async (data: TileFormData) => {
    try {
      const updatedTiles = map.tiles.map(t =>
        t.id === tileId ? { ...t, ...data } : t
      );
      await updateMap({ ...map, tiles: updatedTiles });
      toast({ title: "Tile Saved", description: "The tile has been updated." });
      onSave();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save tile changes." });
    }
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
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
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
            <Button type="submit">Save Tile</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
