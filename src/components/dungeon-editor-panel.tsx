

"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import type { Dungeon, NewDungeon, Room as RoomType, DungeonRoom, DungeonConnection, DungeonSize, DungeonHostilityLevel } from "@/lib/types";
import { getAllRooms, addDungeon, getDungeonById, updateDungeon, deleteDungeon, addTags } from "@/lib/idb";
import { DUNGEON_HOSTILITY, DUNGEON_SIZE, HOSTILITY_LEVELS, SIZE_LEVELS } from "@/lib/dungeon-data";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Tag, X, ArrowLeft, Plus, Warehouse, Link2, Swords, Target } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { TagInput } from "./ui/tag-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";

const dungeonRoomSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
});

const dungeonConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
});

const dungeonSchema = z.object({
  name: z.string().min(1, "Dungeon name is required"),
  description: z.string().optional(),
  hostility: z.enum(HOSTILITY_LEVELS),
  size: z.enum(SIZE_LEVELS),
  threatRating: z.coerce.number(),
  treasureValue: z.coerce.number(),
  tags: z.array(z.string()).optional(),
  rooms: z.array(dungeonRoomSchema),
  connections: z.array(dungeonConnectionSchema),
});

type DungeonFormData = z.infer<typeof dungeonSchema>;

const RoomSelectionDialog = ({ onAddRooms, existingRoomIds }: { onAddRooms: (rooms: RoomType[]) => void, existingRoomIds: Set<string> }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allRooms, setAllRooms] = useState<RoomType[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      getAllRooms().then(setAllRooms);
    }
  }, [isOpen]);

  const filteredRooms = useMemo(() => {
    return allRooms.filter(room => 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) && !existingRoomIds.has(room.id)
    );
  }, [allRooms, searchTerm, existingRoomIds]);

  const handleAddClick = () => {
    const roomsToAdd = allRooms.filter(r => selectedRoomIds.has(r.id));
    onAddRooms(roomsToAdd);
    setIsOpen(false);
    setSelectedRoomIds(new Set());
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild><Button type="button" size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Add Room</Button></DialogTrigger>
      <DialogContent className="max-w-lg h-[70vh] flex flex-col">
        <DialogHeader><DialogTitle>Select Rooms</DialogTitle></DialogHeader>
        <Input placeholder="Search rooms..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-4 shrink-0"/>
        <ScrollArea className="flex-1 border rounded-md p-2">
          <div className="space-y-1">
            {filteredRooms.map(room => (
              <div key={room.id} className="flex items-center gap-3 p-2 rounded-md">
                <Checkbox id={`room-${room.id}`} onCheckedChange={() => setSelectedRoomIds(prev => { const newSet = new Set(prev); if (newSet.has(room.id)) { newSet.delete(room.id); } else { newSet.add(room.id); } return newSet; })} checked={selectedRoomIds.has(room.id)} />
                <label htmlFor={`room-${room.id}`} className="flex-1"><p className="font-semibold">{room.name}</p></label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 shrink-0">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleAddClick} disabled={selectedRoomIds.size === 0}>Add Selected</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


interface DungeonEditorPanelProps {
  dungeonId: string | null;
  isCreatingNew: boolean;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onEditCancel: () => void;
  onRunDungeon: (id: string) => void;
  onBack?: () => void;
  dataVersion: number;
}

const defaultValues: DungeonFormData = {
  name: "",
  description: "",
  hostility: 'I',
  size: 'Tiny',
  threatRating: 0,
  treasureValue: 0,
  tags: [],
  rooms: [],
  connections: [],
};

export default function DungeonEditorPanel({ dungeonId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onRunDungeon, onBack, dataVersion }: DungeonEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!dungeonId);
  const [dungeonData, setDungeonData] = useState<Dungeon | null>(null);
  const [allRooms, setAllRooms] = useState<RoomType[]>([]);
  const roomMap = useMemo(() => new Map(allRooms.map(r => [r.id, r])), [allRooms]);
  const isMobile = useIsMobile();

  const form = useForm<DungeonFormData>({ resolver: zodResolver(dungeonSchema), defaultValues });
  const { control, watch, setValue, getValues } = form;
  const { fields: roomFields, append: appendRoom, remove: removeRoom } = useFieldArray({ control, name: "rooms" });
  const { fields: connectionFields, append: appendConnection, remove: removeConnection } = useFieldArray({ control, name: "connections" });

  const watchedRooms = watch('rooms');
  useEffect(() => {
      const totalValue = watchedRooms.reduce((sum, dungeonRoom) => {
        const roomTemplate = roomMap.get(dungeonRoom.roomId);
        return sum + (roomTemplate?.totalTreasureValue || 0);
      }, 0);
      setValue('treasureValue', totalValue);
  }, [watchedRooms, roomMap, setValue]);

  useEffect(() => {
    getAllRooms().then(setAllRooms);
  }, []);

  useEffect(() => {
    const fetchDungeonData = async () => {
      if (isCreatingNew) { form.reset(defaultValues); setDungeonData(null); setIsEditing(true); setLoading(false); return; }
      if (!dungeonId) { setIsEditing(false); setLoading(false); setDungeonData(null); return; }
      setLoading(true);
      setIsEditing(false);
      try {
        const data = await getDungeonById(dungeonId);
        if (data) { form.reset(data); setDungeonData(data); } else { setDungeonData(null); }
      } catch (error) { toast({ variant: "destructive", title: "Error", description: "Could not load dungeon data." }); } finally { setLoading(false); }
    };
    fetchDungeonData();
  }, [dungeonId, isCreatingNew, form, toast, dataVersion]);
  
  const handleCancel = () => {
    if (isCreatingNew) { onEditCancel(); } else if (dungeonData) { form.reset(dungeonData); setIsEditing(false); }
  };

  const onSubmit = async (data: DungeonFormData) => {
    try {
      const dungeonToSave = { ...data, tags: data.tags || [] };
      if (data.tags?.length) await addTags(data.tags, 'dungeon');
      let savedId = dungeonId;
      if (isCreatingNew) { savedId = await addDungeon(dungeonToSave); toast({ title: "Dungeon Created!" }); }
      else if (dungeonId) { await updateDungeon({ ...dungeonToSave, id: dungeonId }); toast({ title: "Save Successful" }); }
      if(savedId) onSaveSuccess(savedId);
      setIsEditing(false);
    } catch (error) { toast({ variant: "destructive", title: "Save Failed" }); }
  };

  const handleDelete = async () => {
    if (!dungeonId) return;
    try { await deleteDungeon(dungeonId); toast({ title: "Dungeon Deleted" }); onDeleteSuccess(); }
    catch (error) { toast({ variant: "destructive", title: "Deletion Failed" }); }
  };

  const addRooms = (newRooms: RoomType[]) => {
    newRooms.forEach((room, index) => {
      appendRoom({ id: crypto.randomUUID(), roomId: room.id, position: { x: 100 + index * 5, y: 100 + index * 5 } });
    });
  };
  
  const existingRoomInstanceIds = useMemo(() => new Set(roomFields.map(field => field.roomId)), [roomFields]);
  const hostility = watch('hostility');
  const size = watch('size');
  
  if (loading) return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  if (!dungeonId && !isCreatingNew) return <div className="w-full max-w-5xl mx-auto"><Card className="h-full flex items-center justify-center min-h-[300px]"><CardContent className="text-center pt-6"><p className="text-xl text-muted-foreground">Select a dungeon to view or create one.</p></CardContent></Card></div>;

  if (!isEditing && dungeonData) {
    return (
        <div className="w-full max-w-5xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex flex-row items-start justify-between">
                        <div className="flex items-center gap-2">
                             {isMobile && onBack && <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 -ml-2 -mt-1"><ArrowLeft className="h-5 w-5" /></Button>}
                            <div>
                                <CardTitle className="text-3xl font-bold">{dungeonData.name}</CardTitle>
                                <CardDescription className="flex flex-wrap gap-x-4">
                                    <span>Hostility: {DUNGEON_HOSTILITY[dungeonData.hostility].name}</span>
                                    <span>Size: {dungeonData.size}</span>
                                    <span>TR: {dungeonData.threatRating}</span>
                                    <span>Treasure: {dungeonData.treasureValue}</span>
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                           <Button variant="default" size="sm" onClick={() => onRunDungeon(dungeonData.id)}><Swords className="h-4 w-4 mr-2" />Run</Button>
                           <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {dungeonData.description && <div><h3 className="text-lg font-semibold text-primary-foreground mb-2">Description</h3><p className="text-foreground/80 whitespace-pre-wrap">{dungeonData.description}</p></div>}
                    <Separator/>
                    <div>
                        <h3 className="text-lg font-semibold text-primary-foreground mb-2">Rooms ({dungeonData.rooms.length})</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            {dungeonData.rooms.map(dr => <li key={dr.id} className="text-accent">{roomMap.get(dr.roomId)?.name || 'Unknown Room'}</li>)}
                        </ul>
                    </div>
                    {dungeonData.tags && dungeonData.tags.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/50"><div className="flex flex-wrap gap-2">{dungeonData.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div></div>
                    )}
                </CardContent>
                <CardFooter>
                     <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{dungeonData.name}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
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
                    {isMobile && onBack && <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="shrink-0 -ml-2"><ArrowLeft className="h-5 w-5" /></Button>}
                    <CardTitle>{isCreatingNew ? "Create New Dungeon" : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                  </div>
                  {!isMobile && <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField name="name" control={control} render={({ field }) => (<FormItem><FormLabel>Dungeon Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="description" control={control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={control} name="hostility" render={({ field }) => (<FormItem><FormLabel>Hostility</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{HOSTILITY_LEVELS.map(h => <SelectItem key={h} value={h}>{h}: {DUNGEON_HOSTILITY[h].name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={control} name="size" render={({ field }) => (<FormItem><FormLabel>Size</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{SIZE_LEVELS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <Card className="p-4 bg-muted/50">
                  <CardHeader className="p-0 pb-2"><CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5"/> Target Values</CardTitle></CardHeader>
                  <CardContent className="p-0 text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div><span className="font-semibold text-foreground">Rooms: </span>{DUNGEON_SIZE[size].rooms}</div>
                      <div><span className="font-semibold text-foreground">Treasure: </span>{DUNGEON_SIZE[size].treasureRoll}</div>
                      <div><span className="font-semibold text-foreground">TR Range: </span>{DUNGEON_HOSTILITY[hostility].threatRange}</div>
                  </CardContent>
                </Card>

                <FormField name="tags" control={control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />Tags</FormLabel><FormControl><TagInput value={field.value || []} onChange={field.onChange} placeholder="Add tags..." tagSource="dungeon" /></FormControl><FormMessage /></FormItem>)} />

                <Separator />
                
                <div>
                  <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-primary-foreground flex items-center gap-2"><Warehouse className="h-5 w-5"/>Rooms</h3><RoomSelectionDialog onAddRooms={addRooms} existingRoomIds={existingRoomInstanceIds}/></div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {roomFields.map((field, index) => (<div key={field.id} className="flex items-center gap-2 p-2 bg-card-foreground/5 rounded-md"><p className="flex-1 font-semibold">{roomMap.get(field.roomId)?.name || 'Unknown Room'}</p><Button type="button" variant="ghost" size="icon" onClick={() => removeRoom(index)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button></div>))}
                    {roomFields.length === 0 && <p className="text-muted-foreground text-center text-sm py-4">No rooms added.</p>}
                  </div>
                   <FormField control={control} name="treasureValue" render={({ field }) => (<FormItem className="mt-2"><FormLabel>Total Treasure Value</FormLabel><FormControl><Input type="number" {...field} readOnly className="w-24 bg-muted border-none"/></FormControl></FormItem>)} />
                </div>

                <Separator />
                
                <div>
                  <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-primary-foreground flex items-center gap-2"><Link2 className="h-5 w-5"/>Connections</h3><Button type="button" size="sm" variant="outline" onClick={() => appendConnection({ from: '', to: ''})} disabled={roomFields.length < 2}><Plus className="h-4 w-4 mr-2" />Add Connection</Button></div>
                   <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {connectionFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2 p-2 bg-card-foreground/5 rounded-md">
                            <FormField control={control} name={`connections.${index}.from`} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="From..."/></SelectTrigger></FormControl><SelectContent>{roomFields.map(r => <SelectItem key={r.id} value={r.id}>{roomMap.get(r.roomId)?.name || '...'}</SelectItem>)}</SelectContent></Select>)} />
                            <span>-&gt;</span>
                            <FormField control={control} name={`connections.${index}.to`} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="To..."/></SelectTrigger></FormControl><SelectContent>{roomFields.map(r => <SelectItem key={r.id} value={r.id}>{roomMap.get(r.roomId)?.name || '...'}</SelectItem>)}</SelectContent></Select>)} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeConnection(index)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                   </div>
                </div>
            </CardContent>
            <CardFooter className="flex items-center gap-2">
              {!isCreatingNew && <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{getValues("name")}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
              <div className="flex-grow" />
              {!isMobile && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
              <Button type="submit">{isCreatingNew ? "Create Dungeon" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
