
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getRoomById, addRoom, updateRoom, deleteRoom, addTags, getAllEncounters, getAllTreasures, getAllAlchemicalItems } from "@/lib/idb";
import type { Room, NewRoom, Encounter, Treasure, AlchemicalItem } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, Tag, X, ArrowLeft, Plus, Link as LinkIcon, Bot, Gem, FlaskConical } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";

const roomFeatureSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Feature description is required"),
  encounterIds: z.array(z.string()),
  treasureIds: z.array(z.string()),
  alchemicalItemIds: z.array(z.string()),
});

const roomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  description: z.string().optional(),
  size: z.string().optional(),
  tags: z.array(z.string()).optional(),
  features: z.array(roomFeatureSchema),
  totalTreasureValue: z.coerce.number(),
});

type RoomFormData = z.infer<typeof roomSchema>;

const ItemSelectionDialog = ({ 
  triggerButton,
  dialogTitle,
  items,
  onSelectItems,
  initialSelectedIds = [] 
}: { 
  triggerButton: React.ReactNode,
  dialogTitle: string,
  items: {id: string, name: string, value?: number, type?: string}[],
  onSelectItems: (ids: string[]) => void,
  initialSelectedIds?: string[] 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm]);

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
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="max-w-lg h-[70vh] flex flex-col">
        <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle></DialogHeader>
        <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-4 shrink-0"/>
        <ScrollArea className="flex-1 border rounded-md p-2">
          <div className="space-y-1">
            {filteredItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-md">
                <Checkbox id={`item-${item.id}`} onCheckedChange={() => handleCheckboxChange(item.id)} checked={selectedIds.has(item.id)} />
                <label htmlFor={`item-${item.id}`} className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.value !== undefined && `Value: ${item.value}`}
                    {item.type && `Type: ${item.type}`}
                  </p>
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


interface RoomEditorPanelProps {
  roomId: string | null;
  isCreatingNew: boolean;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onEditCancel: () => void;
  onFilterByClick: (updates: { tagFilter?: string }, e: React.MouseEvent) => void;
  onBack?: () => void;
}

const defaultValues: RoomFormData = {
  name: "",
  description: "",
  size: "",
  tags: [],
  features: [],
  totalTreasureValue: 0,
};

export default function RoomEditorPanel({ roomId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onFilterByClick, onBack }: RoomEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!roomId);
  const [roomData, setRoomData] = useState<Room | null>(null);
  
  const [allEncounters, setAllEncounters] = useState<Encounter[]>([]);
  const [allTreasures, setAllTreasures] = useState<Treasure[]>([]);
  const [allAlchemicalItems, setAllAlchemicalItems] = useState<AlchemicalItem[]>([]);
  
  const isMobile = useIsMobile();

  const itemMaps = useMemo(() => ({
      encounters: new Map(allEncounters.map(e => [e.id, e])),
      treasures: new Map(allTreasures.map(t => [t.id, t])),
      alchemicalItems: new Map(allAlchemicalItems.map(a => [a.id, a])),
  }), [allEncounters, allTreasures, allAlchemicalItems]);

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: defaultValues,
  });
  
  const { fields: featureFields, append: appendFeature, remove: removeFeature, update: updateFeature } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const watchedFeatures = form.watch('features');
  useEffect(() => {
    if (isEditing) {
      const totalValue = watchedFeatures.reduce((total, feature) => {
        const featureValue = feature.treasureIds.reduce((sum, treasureId) => {
            const treasure = itemMaps.treasures.get(treasureId);
            return sum + (treasure?.value || 0);
        }, 0);
        return total + featureValue;
      }, 0);
      
      if (form.getValues('totalTreasureValue') !== totalValue) {
        form.setValue('totalTreasureValue', totalValue, { shouldValidate: true });
      }
    }
  }, [watchedFeatures, itemMaps.treasures, form, isEditing]);


  useEffect(() => {
    Promise.all([
      getAllEncounters(),
      getAllTreasures(),
      getAllAlchemicalItems(),
    ]).then(([encounters, treasures, alchemy]) => {
      setAllEncounters(encounters);
      setAllTreasures(treasures);
      setAllAlchemicalItems(alchemy);
    });
  }, []);

  useEffect(() => {
    const fetchRoomData = async () => {
      if (isCreatingNew) {
        form.reset(defaultValues);
        setRoomData(null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!roomId) {
        setIsEditing(false);
        setLoading(false);
        setRoomData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const roomFromDb = await getRoomById(roomId);
        if (roomFromDb) {
          form.reset(roomFromDb);
          setRoomData(roomFromDb);
        } else {
          setRoomData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load room data." });
      } finally {
        setLoading(false);
      }
    };
    fetchRoomData();
  }, [roomId, isCreatingNew, form, toast]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
        onEditCancel();
    } else if (roomData) {
        form.reset(roomData);
        setIsEditing(false);
    }
  };

  const onSubmit = async (data: RoomFormData) => {
    try {
      const roomToSave: NewRoom | Room = { ...data, tags: data.tags || [] };
      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) await addTags(tagsToSave, 'room');

      let savedId: string;
      if (isCreatingNew) {
        savedId = await addRoom(roomToSave as NewRoom);
        toast({ title: "Room Created!", description: `${data.name} has been added.` });
      } else if (roomId) {
        savedId = roomId;
        await updateRoom({ ...roomToSave, id: roomId });
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
    if (!roomId) return;
    try {
      await deleteRoom(roomId);
      toast({ title: "Room Deleted", description: "The room has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the room." });
    }
  };
  
  const handleAddFeature = () => {
    appendFeature({
      id: crypto.randomUUID(),
      description: "",
      encounterIds: [],
      treasureIds: [],
      alchemicalItemIds: [],
    });
  };

  if (loading) return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  
  if (!roomId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center pt-6"><p className="text-xl text-muted-foreground">Select a room to view or create a new one.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditing && roomData) {
    return (
        <div className="w-full max-w-5xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex flex-row items-start justify-between">
                        <div className="flex items-center gap-2">
                             {isMobile && onBack && <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 -ml-2 -mt-1"><ArrowLeft className="h-5 w-5" /></Button>}
                            <div>
                                <CardTitle className="text-3xl font-bold">{roomData.name}</CardTitle>
                                <CardDescription className="flex flex-wrap gap-x-4">
                                  {roomData.size && <span>Size: {roomData.size}</span>}
                                  <span>Total Value: {roomData.totalTreasureValue}</span>
                                </CardDescription>
                            </div>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4"/><span className="hidden sm:inline ml-2">Edit</span></Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {roomData.description && <div><h3 className="text-lg font-semibold text-primary-foreground mb-2">Description</h3><p className="text-foreground/80 whitespace-pre-wrap">{roomData.description}</p></div>}
                        
                        <div>
                            <h3 className="text-lg font-semibold text-primary-foreground mb-2">Features</h3>
                            {roomData.features.length > 0 ? (
                                <ul className="space-y-4">
                                    {roomData.features.map(feature => (
                                        <li key={feature.id} className="p-3 bg-card-foreground/5 rounded-lg">
                                            <p className="font-semibold">{feature.description}</p>
                                            {feature.encounterIds.length > 0 && <div className="mt-2 pl-4"><h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Bot className="h-4 w-4"/> Linked Encounters</h4><ul className="list-disc list-inside mt-1">{feature.encounterIds.map(id => <li key={id} className="text-sm text-accent">{itemMaps.encounters.get(id)?.name || '...'}</li>)}</ul></div>}
                                            {feature.treasureIds.length > 0 && <div className="mt-2 pl-4"><h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Gem className="h-4 w-4"/> Linked Treasures</h4><ul className="list-disc list-inside mt-1">{feature.treasureIds.map(id => <li key={id} className="text-sm text-accent">{itemMaps.treasures.get(id)?.name || '...'}</li>)}</ul></div>}
                                            {feature.alchemicalItemIds.length > 0 && <div className="mt-2 pl-4"><h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><FlaskConical className="h-4 w-4"/> Linked Alchemy</h4><ul className="list-disc list-inside mt-1">{feature.alchemicalItemIds.map(id => <li key={id} className="text-sm text-accent">{itemMaps.alchemicalItems.get(id)?.name || '...'}</li>)}</ul></div>}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-muted-foreground">No features defined for this room.</p>}
                        </div>
                        
                        {roomData.tags && roomData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {roomData.tags.map(tag => <button key={tag} onClick={(e) => onFilterByClick({ tagFilter: tag }, e)} className="bg-transparent border-none p-0 m-0"><Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">{tag}</Badge></button>)}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                     <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{roomData.name}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
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
                    {isMobile && onBack && <Button type="button" variant="ghost" size="icon" onClick={onEditCancel} className="shrink-0 -ml-2"><ArrowLeft className="h-5 w-5" /></Button>}
                    <CardTitle>{isCreatingNew ? "Create New Room" : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                  </div>
                  {!isMobile && <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="size" control={form.control} render={({ field }) => (<FormItem><FormLabel>Size</FormLabel><FormControl><Input {...field} placeholder="e.g., 30ft x 40ft" /></FormControl></FormItem>)} />
                </div>
                 <FormField name="totalTreasureValue" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Treasure Value</FormLabel>
                    <FormControl><Input type="number" {...field} readOnly className="w-28 bg-muted border-none"/></FormControl>
                  </FormItem>
                 )} />
                <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>)} />
                <FormField name="tags" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />Tags</FormLabel><FormControl><TagInput value={field.value || []} onChange={field.onChange} placeholder="Add tags..." tagSource="room" /></FormControl><FormMessage /></FormItem>)} />

                <Separator />
              
                <div>
                  <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-primary-foreground">Room Features</h3><Button type="button" size="sm" variant="outline" onClick={handleAddFeature}><Plus className="h-4 w-4 mr-2" /> Add Feature</Button></div>
                  <div className="space-y-3">
                    {featureFields.map((field, index) => (
                      <div key={field.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-card-foreground/5">
                        <div className="flex items-start gap-2">
                          <FormField name={`features.${index}.description`} control={form.control} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)} className="text-muted-foreground hover:text-destructive shrink-0 mt-8"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                            <ItemSelectionDialog
                              triggerButton={<Button type="button" size="sm" variant="outline"><Bot className="h-4 w-4 mr-2" /> Encounters</Button>}
                              dialogTitle="Link Encounters"
                              items={allEncounters.map(e => ({ id: e.id, name: e.name, value: e.totalTR || 0 }))}
                              onSelectItems={(ids) => updateFeature(index, { ...form.getValues(`features.${index}`), encounterIds: ids })}
                              initialSelectedIds={form.getValues(`features.${index}.encounterIds`)}
                            />
                            <ItemSelectionDialog
                              triggerButton={<Button type="button" size="sm" variant="outline"><Gem className="h-4 w-4 mr-2" /> Treasures</Button>}
                              dialogTitle="Link Treasures"
                              items={allTreasures}
                              onSelectItems={(ids) => updateFeature(index, { ...form.getValues(`features.${index}`), treasureIds: ids })}
                              initialSelectedIds={form.getValues(`features.${index}.treasureIds`)}
                            />
                            <ItemSelectionDialog
                              triggerButton={<Button type="button" size="sm" variant="outline"><FlaskConical className="h-4 w-4 mr-2" /> Alchemy</Button>}
                              dialogTitle="Link Alchemical Items"
                              items={allAlchemicalItems.map(a => ({ id: a.id, name: a.name, type: a.type }))}
                              onSelectItems={(ids) => updateFeature(index, { ...form.getValues(`features.${index}`), alchemicalItemIds: ids })}
                              initialSelectedIds={form.getValues(`features.${index}.alchemicalItemIds`)}
                            />
                        </div>
                      </div>
                    ))}
                    {featureFields.length === 0 && <p className="text-muted-foreground text-center text-sm py-4">No features added to this room.</p>}
                  </div>
                </div>

            </CardContent>
            <CardFooter className="flex items-center gap-2">
              {!isCreatingNew && <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{form.getValues("name")}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
              <div className="flex-grow" />
              {!isMobile && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
              <Button type="submit">{isCreatingNew ? "Create Room" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
