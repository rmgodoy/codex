
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getNpcById, addNpc, updateNpc, deleteNpc, addTags, getAllFactions, getAllNpcs, getAllPantheonEntities, getAllRaces } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { Npc, NewNpc, Faction, NpcRelationship, PantheonEntity, Race } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, Tag, X, ArrowLeft, Copy, Plus, Users, Sparkles } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useWorld } from "./world-provider";

const npcRelationshipSchema = z.object({
  id: z.string(),
  targetNpcId: z.string().min(1, "Target NPC is required"),
  type: z.string().min(1, "Relationship type is required"),
});

const npcSchema = z.object({
  name: z.string().min(1, "Name is required"),
  raceId: z.string().optional(),
  age: z.string().optional(),
  role: z.string().optional(),
  personality: z.string().optional(),
  motivation: z.string().optional(),
  backstory: z.string().optional(),
  appearance: z.string().optional(),
  factionIds: z.array(z.string()).optional(),
  beliefIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  relationships: z.array(npcRelationshipSchema).optional(),
});

type NpcFormData = z.infer<typeof npcSchema>;

const FactionSelectionDialog = ({
  onConfirm,
  allFactions,
  initialSelectedIds,
  children
}: {
  onConfirm: (ids: string[]) => void;
  allFactions: Faction[];
  initialSelectedIds: string[];
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSelection, setCurrentSelection] = useState(new Set(initialSelectedIds));

  useEffect(() => {
    if(isOpen) {
      setCurrentSelection(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  const filteredFactions = useMemo(() => {
    return allFactions.filter(faction =>
      faction.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allFactions, searchTerm]);

  const handleConfirm = () => {
    onConfirm(Array.from(currentSelection));
    setIsOpen(false);
  };

  const handleCheckboxChange = (factionId: string) => {
    setCurrentSelection(prev => {
      const newSet = new Set(prev);
      if (newSet.has(factionId)) {
        newSet.delete(factionId);
      } else {
        newSet.add(factionId);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md h-[60vh] flex flex-col">
        <DialogHeader><DialogTitle>Select Factions</DialogTitle></DialogHeader>
        <Input
          placeholder="Search factions..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="mb-4 shrink-0"
        />
        <ScrollArea className="flex-1 border rounded-md p-2">
          {filteredFactions.map(faction => (
            <div key={faction.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
              <Checkbox
                id={`faction-dialog-${faction.id}`}
                checked={currentSelection.has(faction.id)}
                onCheckedChange={() => handleCheckboxChange(faction.id)}
              />
              <label htmlFor={`faction-dialog-${faction.id}`} className="font-normal flex-1 cursor-pointer">{faction.name}</label>
            </div>
          ))}
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BeliefSelectionDialog = ({ onConfirm, allEntities, initialSelectedIds, children }: { onConfirm: (ids: string[]) => void; allEntities: PantheonEntity[]; initialSelectedIds: string[]; children: React.ReactNode; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSelection, setCurrentSelection] = useState(new Set(initialSelectedIds));
    
    useEffect(() => {
        if(isOpen) {
            setCurrentSelection(new Set(initialSelectedIds));
        }
    }, [isOpen, initialSelectedIds]);

    const filteredEntities = useMemo(() => {
        return allEntities.filter(entity => entity.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allEntities, searchTerm]);
    
    const handleConfirm = () => {
        onConfirm(Array.from(currentSelection));
        setIsOpen(false);
    };

    const handleCheckboxChange = (entityId: string) => {
        setCurrentSelection(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entityId)) {
                newSet.delete(entityId);
            } else {
                newSet.add(entityId);
            }
            return newSet;
        });
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-md h-[60vh] flex flex-col">
                <DialogHeader><DialogTitle>Select Beliefs</DialogTitle></DialogHeader>
                <Input
                    placeholder="Search entities..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="mb-4 shrink-0"
                />
                <ScrollArea className="flex-1 border rounded-md p-2">
                    {filteredEntities.map(entity => (
                        <div key={entity.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                            <Checkbox
                                id={`belief-dialog-${entity.id}`}
                                checked={currentSelection.has(entity.id)}
                                onCheckedChange={() => handleCheckboxChange(entity.id)}
                            />
                            <label htmlFor={`belief-dialog-${entity.id}`} className="font-normal flex-1 cursor-pointer">{entity.name}</label>
                        </div>
                    ))}
                </ScrollArea>
                <DialogFooter className="pt-4">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirm}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const AddRelationshipDialog = ({ currentNpcId, allNpcs, onAdd }: { currentNpcId: string | null, allNpcs: Npc[], onAdd: (relationship: NpcRelationship) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetNpcId, setTargetNpcId] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const availableNpcs = useMemo(() => {
    return allNpcs.filter(npc => npc.id !== currentNpcId);
  }, [allNpcs, currentNpcId]);

  const handleAdd = () => {
    if (targetNpcId && relationshipType) {
      onAdd({
        id: crypto.randomUUID(),
        targetNpcId: targetNpcId,
        type: relationshipType,
      });
      setIsOpen(false);
      setTargetNpcId('');
      setRelationshipType('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" /> Add Relationship</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New Relationship</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="target-npc">Target NPC</Label>
             <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="target-npc"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                    >
                        {targetNpcId ? availableNpcs.find(npc => npc.id === targetNpcId)?.name : "Select an NPC..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <ScrollArea className="h-48">
                      {availableNpcs.map(npc => (
                          <Button
                              key={npc.id}
                              variant="ghost"
                              onClick={() => {
                                  setTargetNpcId(npc.id);
                                  setIsPickerOpen(false);
                              }}
                              className={cn("w-full justify-start", targetNpcId === npc.id && "bg-accent")}
                          >
                              {npc.name}
                          </Button>
                      ))}
                    </ScrollArea>
                </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship-type">Relationship Type</Label>
            <Input
              id="relationship-type"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              placeholder="e.g., friends with, hates, sibling of..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!targetNpcId || !relationshipType}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


interface NpcEditorPanelProps {
  npcId: string | null;
  isCreatingNew: boolean;
  template: Partial<Npc> | null;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onUseAsTemplate: (npcData: Npc) => void;
  onEditCancel: () => void;
  onBack?: () => void;
  dataVersion: number;
}

const defaultValues: NpcFormData = {
  name: "",
  raceId: undefined,
  age: "",
  role: "",
  personality: "",
  motivation: "",
  backstory: "",
  appearance: "",
  factionIds: [],
  beliefIds: [],
  tags: [],
  relationships: [],
};

export default function NpcEditorPanel({ npcId, isCreatingNew, template, onSaveSuccess, onDeleteSuccess, onUseAsTemplate, onEditCancel, onBack, dataVersion }: NpcEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!npcId);
  const [npcData, setNpcData] = useState<Npc | null>(null);
  const [allNpcs, setAllNpcs] = useState<Npc[]>([]);
  const [allFactions, setAllFactions] = useState<Faction[]>([]);
  const [allEntities, setAllEntities] = useState<PantheonEntity[]>([]);
  const [allRaces, setAllRaces] = useState<Race[]>([]);
  const isMobile = useIsMobile();
  const { worldSlug } = useWorld();
  
  const factionMap = useMemo(() => new Map(allFactions.map(f => [f.id, f.name])), [allFactions]);
  const entityMap = useMemo(() => new Map(allEntities.map(e => [e.id, e.name])), [allEntities]);
  const npcMap = useMemo(() => new Map(allNpcs.map(n => [n.id, n.name])), [allNpcs]);
  const raceMap = useMemo(() => new Map(allRaces.map(r => [r.id, r.name])), [allRaces]);

  const form = useForm<NpcFormData>({
    resolver: zodResolver(npcSchema),
    defaultValues: template ? {...defaultValues, ...template} : defaultValues,
  });

  const { fields: relationshipFields, append: appendRelationship, remove: removeRelationship } = useFieldArray({
    control: form.control,
    name: "relationships",
  });

  useEffect(() => {
    Promise.all([
      getAllNpcs(),
      getAllFactions(),
      getAllPantheonEntities(),
      getAllRaces()
    ]).then(([npcs, factions, entities, races]) => {
      setAllNpcs(npcs);
      setAllFactions(factions);
      setAllEntities(entities);
      setAllRaces(races);
    });
  }, [dataVersion]);

  useEffect(() => {
    const fetchNpcData = async () => {
      if (isCreatingNew) {
        form.reset(template ? { ...defaultValues, ...template } : defaultValues);
        setNpcData(template as Npc | null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!npcId) {
        setIsEditing(false);
        setLoading(false);
        setNpcData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const npcFromDb = await getNpcById(npcId);
        if (npcFromDb) {
          form.reset({ ...defaultValues, ...npcFromDb });
          setNpcData(npcFromDb);
        } else {
          setNpcData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load NPC data." });
      } finally {
        setLoading(false);
      }
    };
    fetchNpcData();
  }, [npcId, isCreatingNew, template, form, toast, dataVersion]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
      onEditCancel();
    } else if (npcData) {
      form.reset({ ...defaultValues, ...npcData });
      setIsEditing(false);
    }
  };
  
  const handleUseAsTemplate = () => {
    if (npcData) {
      onUseAsTemplate(npcData);
    }
  };

  const onFormError = (errors: any) => {
    const errorMessages = Object.entries(errors).map(([fieldName, error]: [string, any]) => 
        `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${error.message}`
    ).join('\n');
    
    toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: <pre className="whitespace-pre-wrap">{errorMessages}</pre>,
    });
  };

  const onSubmit = async (data: NpcFormData) => {
    try {
      const npcToSave: NewNpc | Npc = {
        ...data,
        raceId: data.raceId === 'none' ? undefined : data.raceId,
        tags: data.tags || [],
        factionIds: data.factionIds || [],
        beliefIds: data.beliefIds || [],
        relationships: data.relationships || [],
      };

      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave, 'npc');
      }

      if (isCreatingNew) {
        const newId = await addNpc(npcToSave as NewNpc);
        toast({ title: "NPC Created!", description: `${data.name} has been added.` });
        onSaveSuccess(newId);
      } else if (npcId) {
        await updateNpc({ ...npcToSave, id: npcId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
        onSaveSuccess(npcId);
      }
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDelete = async () => {
    if (!npcId) return;
    try {
      await deleteNpc(npcId);
      // TODO: Also remove relationships pointing to this NPC from other NPCs
      toast({ title: "NPC Deleted", description: "The NPC has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the NPC." });
    }
  };

  if (loading) {
    return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  }
  
  if (!npcId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center pt-6">
              <p className="text-xl text-muted-foreground">Select an NPC to view</p>
              <p className="text-muted-foreground">or create a new one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditing && npcData) {
    const raceName = npcData.raceId ? raceMap.get(npcData.raceId) : null;

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
                                <CardTitle className="text-3xl font-bold">{npcData.name}</CardTitle>
                                <CardDescription className="flex flex-wrap gap-x-4">
                                    {raceName && <span><a href={`#/${worldSlug}/races/${npcData.raceId}`} className="hover:underline">{raceName}</a></span>}
                                    {npcData.age && <span>{npcData.age}</span>}
                                    {npcData.role && <span>{npcData.role}</span>}
                                </CardDescription>
                            </div>
                        </div>
                         <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleUseAsTemplate}>
                                <Copy className="h-4 w-4"/>
                                <span className="hidden sm:inline">Template</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit className="h-4 w-4"/>
                                <span className="hidden sm:inline">Edit</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {(npcData.factionIds && npcData.factionIds.length > 0 || npcData.beliefIds && npcData.beliefIds.length > 0) && (
                            <>
                                <div>
                                <div className="flex flex-wrap gap-x-8 gap-y-4">
                                {npcData.factionIds && npcData.factionIds.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">Factions</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {npcData.factionIds.map(id => (
                                                <Badge key={id} variant="secondary">{factionMap.get(id) || 'Unknown'}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {npcData.beliefIds && npcData.beliefIds.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">Beliefs</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {npcData.beliefIds.map(id => (
                                                <Badge key={id} variant="secondary">{entityMap.get(id) || 'Unknown'}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                </div>
                                </div>
                                <Separator />
                            </>
                        )}
                        {npcData.relationships && npcData.relationships.length > 0 && (
                             <>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Relationships</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {npcData.relationships.map(rel => (
                                            <li key={rel.id} className="text-sm">
                                                <span className="capitalize">{rel.type}</span> <span className="font-semibold text-accent">{npcMap.get(rel.targetNpcId) || 'Unknown NPC'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <Separator />
                            </>
                        )}
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">Appearance</h3><p className="text-foreground/80 whitespace-pre-wrap">{npcData.appearance || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">Personality</h3><p className="text-foreground/80 whitespace-pre-wrap">{npcData.personality || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">Motivation</h3><p className="text-foreground/80 whitespace-pre-wrap">{npcData.motivation || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">Backstory</h3><p className="text-foreground/80 whitespace-pre-wrap">{npcData.backstory || "Not specified."}</p></div>
                        {npcData.tags && npcData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {npcData.tags.map(tag => (
                                        <Badge key={tag} variant="secondary">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                     <AlertDialog>
                      <AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{npcData.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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
          <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="space-y-6">
            <CardHeader>
              <div className="flex flex-row justify-between items-start">
                  <div className="flex items-center gap-2">
                    {isMobile && onBack && (
                        <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="shrink-0 -ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                      <CardTitle>{isCreatingNew ? (isMobile ? "New NPC" : "Create New NPC") : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                    </div>
                  </div>
                  {!isMobile && (
                      <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="raceId" control={form.control} render={({ field }) => (
                      <FormItem>
                          <FormLabel>Race</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || 'none'}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select a race..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {allRaces.map(race => <SelectItem key={race.id} value={race.id}>{race.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="age" control={form.control} render={({ field }) => (<FormItem><FormLabel>Age</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="role" control={form.control} render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField
                        control={form.control}
                        name="factionIds"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Factions</FormLabel>
                            <div className="space-y-2">
                                <FactionSelectionDialog
                                    onConfirm={field.onChange}
                                    allFactions={allFactions}
                                    initialSelectedIds={field.value || []}
                                >
                                    <Button type="button" variant="outline" className="w-full justify-between">
                                        <span>{field.value?.length ? `${field.value.length} selected` : 'Select Factions...'}</span>
                                        <Users className="h-4 w-4 opacity-50" />
                                    </Button>
                                </FactionSelectionDialog>
                                <div className="flex flex-wrap gap-1">
                                {(field.value || []).map(id => {
                                    const factionName = factionMap.get(id);
                                    if (!factionName) return null;
                                    return ( <Badge key={id} variant="secondary">{factionName}</Badge> )
                                })}
                                </div>
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <FormField
                    control={form.control}
                    name="beliefIds"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Beliefs</FormLabel>
                        <div className="space-y-2">
                            <BeliefSelectionDialog
                                onConfirm={field.onChange}
                                allEntities={allEntities}
                                initialSelectedIds={field.value || []}
                            >
                                <Button type="button" variant="outline" className="w-full justify-between">
                                    <span>{field.value?.length ? `${field.value.length} selected` : 'Select Beliefs...'}</span>
                                    <Sparkles className="h-4 w-4 opacity-50" />
                                </Button>
                            </BeliefSelectionDialog>
                            <div className="flex flex-wrap gap-1">
                            {(field.value || []).map(id => {
                                const entityName = entityMap.get(id);
                                if (!entityName) return null;
                                return ( <Badge key={id} variant="secondary">{entityName}</Badge> )
                            })}
                            </div>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField name="appearance" control={form.control} render={({ field }) => (<FormItem><FormLabel>Appearance</FormLabel><FormControl><Textarea {...field} rows={2} value={field.value ?? ''} /></FormControl></FormItem>)} />
                <FormField name="personality" control={form.control} render={({ field }) => (<FormItem><FormLabel>Personality</FormLabel><FormControl><Textarea {...field} rows={3} value={field.value ?? ''} /></FormControl></FormItem>)} />
                <FormField name="motivation" control={form.control} render={({ field }) => (<FormItem><FormLabel>Motivation</FormLabel><FormControl><Textarea {...field} rows={3} value={field.value ?? ''} /></FormControl></FormItem>)} />
                <FormField name="backstory" control={form.control} render={({ field }) => (<FormItem><FormLabel>Backstory</FormLabel><FormControl><Textarea {...field} rows={5} value={field.value ?? ''} /></FormControl></FormItem>)} />
                
                <Separator />
                
                 <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Relationships</h3>
                        <AddRelationshipDialog currentNpcId={npcId} allNpcs={allNpcs} onAdd={appendRelationship} />
                    </div>
                    <div className="space-y-2">
                        {relationshipFields.map((field, index) => {
                            const targetNpc = npcMap.get(field.targetNpcId);
                            return (
                                <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card-foreground/5">
                                <p className="flex-1">
                                    <span className="capitalize">{field.type}</span> <span className="font-semibold text-accent">{targetNpc || '...'}</span>
                                </p>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeRelationship(index)} className="text-muted-foreground hover:text-destructive shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </div>
                            );
                        })}
                        {relationshipFields.length === 0 && <p className="text-muted-foreground text-center text-sm py-2">No relationships defined.</p>}
                    </div>
                </div>

                <Separator />
                
                <FormField
                    name="tags"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />Tags</FormLabel>
                        <FormControl>
                            <TagInput 
                                value={field.value || []} 
                                onChange={field.onChange} 
                                placeholder="Add tags..." 
                                tagSource="npc"
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter className="flex items-center gap-2">
              {!isCreatingNew && (<AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{form.getValues("name")}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
              <div className="flex-grow" />
              {!isMobile && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
              <Button type="submit">{isCreatingNew ? "Create NPC" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
