
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getCityById, addCity, updateCity, deleteCity, addTags, getAllNpcs, getAllMaps } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { City, NewCity, Npc, Map as WorldMap, Hex } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, Tag, X, ArrowLeft, MapPin, Users } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";
import { LocationPickerDialog } from "./location-picker-dialog";
import { MultiItemSelectionDialog } from "./multi-item-selection-dialog";

const citySchema = z.object({
  name: z.string().min(1, "City name is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  npcIds: z.array(z.string()).optional(),
  location: z.object({
    mapId: z.string(),
    hex: z.object({
        q: z.number(),
        r: z.number(),
        s: z.number(),
    })
  }).optional(),
});

type CityFormData = z.infer<typeof citySchema>;

interface CityEditorPanelProps {
  cityId: string | null;
  isCreatingNew: boolean;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onEditCancel: () => void;
  onBack?: () => void;
}

const defaultValues: CityFormData = {
  name: "",
  description: "",
  tags: [],
  npcIds: [],
  location: undefined,
};

export default function CityEditorPanel({ cityId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onBack }: CityEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!cityId);
  const [cityData, setCityData] = useState<City | null>(null);
  const [allNpcs, setAllNpcs] = useState<Npc[]>([]);
  const [allMaps, setAllMaps] = useState<WorldMap[]>([]);
  const isMobile = useIsMobile();
  
  const npcMap = useMemo(() => new Map(allNpcs.map(n => [n.id, n.name])), [allNpcs]);
  const mapMap = useMemo(() => new Map(allMaps.map(m => [m.id, m.name])), [allMaps]);

  const form = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: defaultValues,
  });
  
  useEffect(() => {
    Promise.all([getAllNpcs(), getAllMaps()]).then(([npcs, maps]) => {
      setAllNpcs(npcs);
      setAllMaps(maps);
    });
  }, []);

  useEffect(() => {
    const fetchCityData = async () => {
      if (isCreatingNew) {
        form.reset(defaultValues);
        setCityData(null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!cityId) {
        setIsEditing(false);
        setLoading(false);
        setCityData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const cityFromDb = await getCityById(cityId);
        if (cityFromDb) {
          form.reset(cityFromDb);
          setCityData(cityFromDb);
        } else {
          setCityData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load city data." });
      } finally {
        setLoading(false);
      }
    };
    fetchCityData();
  }, [cityId, isCreatingNew, form, toast]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
      onEditCancel();
    } else if (cityData) {
      form.reset(cityData);
      setIsEditing(false);
    }
  };

  const onSubmit = async (data: CityFormData) => {
    try {
      const cityToSave: NewCity | City = {
        ...data,
        tags: data.tags || [],
        npcIds: data.npcIds || [],
      };

      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave, 'city');
      }

      let savedId: string;
      if (isCreatingNew) {
        savedId = await addCity(cityToSave as NewCity);
        toast({ title: "City Created!", description: `${data.name} has been added.` });
      } else if (cityId) {
        savedId = cityId;
        await updateCity({ ...cityToSave, id: cityId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
      } else {
        return;
      }
      onSaveSuccess(savedId);
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDelete = async () => {
    if (!cityId) return;
    try {
      await deleteCity(cityId);
      toast({ title: "City Deleted", description: "The city has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the city." });
    }
  };

  if (loading) {
    return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  }
  
  if (!cityId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center pt-6">
              <p className="text-xl text-muted-foreground">Select a city to view</p>
              <p className="text-muted-foreground">or create a new one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditing && cityData) {
    return (
        <div className="w-full max-w-5xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex flex-row items-start justify-between">
                        <div className="flex items-center gap-2">
                             {isMobile && onBack && (
                                <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 -ml-2 -mt-1">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                            <div>
                                <CardTitle className="text-3xl font-bold">{cityData.name}</CardTitle>
                            </div>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4"/>
                            <span className="hidden sm:inline ml-2">Edit</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-primary-foreground mb-2">Description</h3>
                          <p className="text-foreground/80 whitespace-pre-wrap">{cityData.description || "No description provided."}</p>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold text-primary-foreground mb-2">Location</h3>
                            {cityData.location ? (
                                <p className="text-sm">Located on map <span className="font-semibold text-accent">{mapMap.get(cityData.location.mapId) || 'Unknown Map'}</span> at (Q: {cityData.location.hex.q}, R: {cityData.location.hex.r}).</p>
                            ): (
                                <p className="text-sm text-muted-foreground">No location set.</p>
                            )}
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold text-primary-foreground mb-2">Notable NPCs</h3>
                            {cityData.npcIds && cityData.npcIds.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {cityData.npcIds.map(id => <Badge key={id} variant="secondary">{npcMap.get(id) || 'Unknown NPC'}</Badge>)}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No NPCs linked.</p>
                            )}
                        </div>
                        {cityData.tags && cityData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {cityData.tags.map(tag => (
                                        <Badge key={tag} variant="secondary">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                     <AlertDialog>
                      <AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{cityData.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardHeader>
              <div className="flex flex-row justify-between items-start">
                  <div className="flex items-center gap-2">
                    {isMobile && onBack && (
                        <Button type="button" variant="ghost" size="icon" onClick={onEditCancel} className="shrink-0 -ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                      <CardTitle>{isCreatingNew ? (isMobile ? "New City" : "Create New City") : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                    </div>
                  </div>
                  {!isMobile && (
                      <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>)} />
                <FormField
                    name="tags"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />Tags</FormLabel>
                            <FormControl><TagInput value={field.value || []} onChange={field.onChange} placeholder="Add tags..." tagSource="city" /></FormControl>
                        </FormItem>
                    )}
                />
                <Separator />
                <FormField
                    name="location"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            {field.value ? (
                                <div className="flex items-center justify-between p-2 mt-2 border rounded-md">
                                    <p className="font-semibold text-sm">
                                    <span className="text-muted-foreground">Map:</span> {mapMap.get(field.value.mapId) || '...'} 
                                    <span className="text-muted-foreground ml-2">Tile:</span> Q:{field.value.hex.q}, R:{field.value.hex.r}
                                    </p>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => field.onChange(undefined)}>
                                    <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <LocationPickerDialog onLocationSelect={field.onChange}>
                                    <Button type="button" variant="outline" className="w-full mt-2">
                                        <MapPin className="h-4 w-4 mr-2" /> Select Location on Map
                                    </Button>
                                </LocationPickerDialog>
                            )}
                        </FormItem>
                    )}
                />
                <Separator />
                <FormField
                    name="npcIds"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notable NPCs</FormLabel>
                            <MultiItemSelectionDialog
                                items={allNpcs}
                                initialSelectedIds={field.value || []}
                                onConfirm={field.onChange}
                                title="Link NPCs to City"
                                trigger={<Button type="button" variant="outline" className="w-full"><Users className="h-4 w-4 mr-2"/>Link NPCs</Button>}
                            />
                            <div className="flex flex-wrap gap-1 pt-2">
                                {(field.value || []).map(id => <Badge key={id} variant="secondary">{npcMap.get(id) || 'Unknown'}</Badge>)}
                            </div>
                        </FormItem>
                    )}
                />

            </CardContent>
            <CardFooter className="flex items-center gap-2">
              {!isCreatingNew && (<AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{form.getValues("name")}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
              <div className="flex-grow" />
              {!isMobile && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
              <Button type="submit">{isCreatingNew ? "Create City" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
