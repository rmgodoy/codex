
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllMaps, addMap } from '@/lib/idb';
import type { MapData } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';


const mapCreationSchema = z.object({
  name: z.string().min(1, "Map name is required"),
  description: z.string().optional(),
  radius: z.coerce.number().min(1).max(100),
});
type MapCreationFormData = z.infer<typeof mapCreationSchema>;

const NewMapDialog = ({ onMapCreated }: { onMapCreated: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const form = useForm<MapCreationFormData>({
        resolver: zodResolver(mapCreationSchema),
        defaultValues: { name: "", description: "", radius: 10 },
    });
    
    const handleSaveNewMap = async (data: MapCreationFormData) => {
        try {
            await addMap(data);
            toast({ title: "Map Created", description: `${data.name} has been created.` });
            onMapCreated();
            setIsOpen(false);
            form.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not create map." });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full"><PlusCircle /> New Map</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Create New Map</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSaveNewMap)} className="space-y-4">
                        <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField name="radius" control={form.control} render={({ field }) => (<FormItem><FormLabel>Map Radius</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit">Create Map</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};


interface MapListPanelProps {
  onSelectMap: (id: string | null) => void;
  onNewMapCreated: () => void;
  selectedMapId: string | null;
  dataVersion: number;
  onDeleteMap: (id: string) => void;
}

export default function MapListPanel({ 
  onSelectMap, 
  onNewMapCreated, 
  selectedMapId, 
  dataVersion,
  onDeleteMap,
}: MapListPanelProps) {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  useEffect(() => {
    const fetchMaps = async () => {
      setIsLoading(true);
      try {
        setMaps(await getAllMaps());
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch maps from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaps();
  }, [dataVersion, toast]);

  const filteredAndSortedMaps = useMemo(() => {
    let filtered = maps.filter(map => {
      const matchesSearch = map.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (sortOrder === 'desc') {
      sorted.reverse();
    }
    
    return sorted;
  }, [maps, searchTerm, sortOrder]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <NewMapDialog onMapCreated={onNewMapCreated} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search maps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
         <div>
            <Label>Sort by Name</Label>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')} className="w-full">
                  {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 mr-2" /> : <ArrowDown className="h-4 w-4 mr-2" />}
                  Toggle Order
              </Button>
            </div>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <p className="text-muted-foreground text-center">Loading maps...</p>
          ) : filteredAndSortedMaps.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedMaps.map(map => (
                <li key={map.id} className="flex items-center gap-1 group">
                  <button
                    onClick={() => onSelectMap(map.id)}
                    className={`flex-1 w-full text-left p-2 rounded-md transition-colors ${selectedMapId === map.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {map.name}
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="invisible group-hover:visible text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete Map?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{map.name}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteMap(map.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No maps found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
