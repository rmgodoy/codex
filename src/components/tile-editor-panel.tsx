
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Warehouse } from "lucide-react";
import type { MapData, HexTile, Dungeon } from "@/lib/types";
import { TILE_ICON_NAMES } from "@/lib/map-data";
import { useDebounce } from "@/hooks/use-debounce";
import { produce } from 'immer';
import { getAllDungeons } from "@/lib/idb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const tileSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  dungeonIds: z.array(z.string()).optional(),
});

type TileFormData = z.infer<typeof tileSchema>;

const DungeonSelectionDialog = ({ 
  onSelectItems,
  initialSelectedIds = [] 
}: { 
  onSelectItems: (ids: string[]) => void,
  initialSelectedIds?: string[] 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allDungeons, setAllDungeons] = useState<Dungeon[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      getAllDungeons().then(setAllDungeons);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const filtered = allDungeons.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    filtered.sort((a, b) => {
      const aIsSelected = selectedIds.has(a.id);
      const bIsSelected = selectedIds.has(b.id);
      if (aIsSelected && !bIsSelected) return -1;
      if (!aIsSelected && bIsSelected) return 1;
      return a.name.localeCompare(b.name);
    });
    return filtered;
  }, [allDungeons, searchTerm, selectedIds]);

  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleConfirm = () => {
    onSelectItems(Array.from(selectedIds));
    setIsOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedIds(new Set(initialSelectedIds));
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
            <Warehouse className="mr-2 h-4 w-4"/> Link Dungeons
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg h-[70vh] flex flex-col">
        <DialogHeader><DialogTitle>Link Dungeons</DialogTitle></DialogHeader>
        <Input placeholder="Search dungeons..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-4 shrink-0"/>
        <ScrollArea className="flex-1 border rounded-md p-2">
          <div className="space-y-1">
            {filteredItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-md">
                <Checkbox id={`dungeon-${item.id}`} onCheckedChange={() => handleCheckboxChange(item.id)} checked={selectedIds.has(item.id)} />
                <label htmlFor={`dungeon-${item.id}`} className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 shrink-0">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


interface TileEditorPanelProps {
  map: MapData;
  tileId: string;
  onBack: () => void;
  onTileUpdate: (updatedTile: HexTile) => void;
}

export default function TileEditorPanel({ map, tileId, onBack, onTileUpdate }: TileEditorPanelProps) {
  const tile = map.tiles.find(t => t.id === tileId);

  const form = useForm<TileFormData>({
    resolver: zodResolver(tileSchema),
    defaultValues: {
      title: tile?.title || "",
      description: tile?.description || "",
      color: tile?.color || "#cccccc",
      icon: tile?.icon || "none",
      dungeonIds: tile?.dungeonIds || [],
    },
  });
  
  // Reset form when tile changes
  useEffect(() => {
      const tileData = map.tiles.find(t => t.id === tileId);
      form.reset({
        title: tileData?.title || "",
        description: tileData?.description || "",
        color: tileData?.color || "#cccccc",
        icon: tileData?.icon || "none",
        dungeonIds: tileData?.dungeonIds || [],
      });
  }, [tileId, map.tiles, form]);

  const watchedValues = useDebounce(form.watch(), 300);

  useEffect(() => {
    if (!tile) return;
    
    const newValues = {
        title: watchedValues.title || '',
        description: watchedValues.description || '',
        color: watchedValues.color || '#cccccc',
        icon: watchedValues.icon === 'none' ? undefined : watchedValues.icon,
        dungeonIds: watchedValues.dungeonIds || [],
    };
    
    const currentTileValues = {
        title: tile.title || '',
        description: tile.description || '',
        color: tile.color || '#cccccc',
        icon: tile.icon,
        dungeonIds: tile.dungeonIds || [],
    };

    // Only call update if there's an actual change
    if (JSON.stringify(newValues) !== JSON.stringify(currentTileValues)) {
      const updatedTile = produce(tile, draft => {
        draft.title = newValues.title;
        draft.description = newValues.description;
        draft.color = newValues.color;
        draft.icon = newValues.icon;
        draft.dungeonIds = newValues.dungeonIds;
      });
      onTileUpdate(updatedTile);
    }
  }, [watchedValues, tile, onTileUpdate]);


  if (!tile) {
    return (
      <div className="p-4">
        <Button onClick={onBack} variant="ghost"><ArrowLeft className="mr-2" /> Back to Map List</Button>
        <p className="text-muted-foreground mt-4">Tile not found.</p>
      </div>
    );
  }

  const linkedDungeons = form.watch('dungeonIds') || [];

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
        <form className="space-y-4 flex-1 flex flex-col">
          <ScrollArea className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
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
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
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
              <div>
                <Label>Linked Dungeons</Label>
                 <div className="mt-2">
                    <DungeonSelectionDialog
                        onSelectItems={(ids) => form.setValue('dungeonIds', ids, { shouldDirty: true })}
                        initialSelectedIds={linkedDungeons}
                    />
                 </div>
                 {linkedDungeons.length > 0 && (
                     <div className="mt-2 space-y-1">
                        {linkedDungeons.map(id => (
                            <Badge key={id} variant="secondary" className="mr-1 mb-1">Dungeon ID: {id.substring(0,6)}...</Badge>
                        ))}
                     </div>
                 )}
              </div>
            </div>
          </ScrollArea>
        </form>
      </Form>
    </div>
  );
}
