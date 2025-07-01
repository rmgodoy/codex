
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getEncounterById, addEncounter, updateEncounter, deleteEncounter, getAllCreatures, getCreaturesByIds, addTags, getAllEncounterTables } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { Encounter, Creature, MonsterEncounterGroup, PlayerEncounterEntry, EncounterTable } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, X, UserPlus, Swords, Bot, User, Tag, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const playerEncounterEntrySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Player name is required"),
});

const monsterEncounterGroupSchema = z.object({
  monsterId: z.string(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

const encounterSchema = z.object({
  name: z.string().min(1, "Encounter name is required"),
  sceneDescription: z.string().optional(),
  gmNotes: z.string().optional(),
  players: z.array(playerEncounterEntrySchema),
  monsterGroups: z.array(monsterEncounterGroupSchema),
  tags: z.array(z.string()).optional(),
  totalTR: z.coerce.number().optional(),
  encounterTableId: z.string().optional(),
});

type EncounterFormData = z.infer<typeof encounterSchema>;

const MonsterSelectionDialog = ({ onAddCreatures }: { onAddCreatures: (creatures: { id: string; name: string; quantity: number }[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allCreatures, setAllCreatures] = useState<Creature[]>([]);
  const [selectedCreatures, setSelectedCreatures] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      getAllCreatures().then(setAllCreatures);
    }
  }, [isOpen]);

  const filteredCreatures = useMemo(() => {
    return allCreatures.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allCreatures, searchTerm]);

  const handleQuantityChange = (creatureId: string, quantity: number) => {
    if (quantity >= 1) {
      setSelectedCreatures(prev => {
        const newMap = new Map(prev);
        newMap.set(creatureId, quantity);
        return newMap;
      });
    } else {
        setSelectedCreatures(prev => {
            const newMap = new Map(prev);
            newMap.delete(creatureId);
            return newMap;
        });
    }
  };

  const handleAddClick = async () => {
    const creaturesToAdd = Array.from(selectedCreatures.entries()).map(([id, quantity]) => {
      const creature = allCreatures.find(c => c.id === id)!;
      return { id, name: creature.name, quantity };
    });

    if (creaturesToAdd.length > 0) {
      onAddCreatures(creaturesToAdd);
    }
    setIsOpen(false);
    setSelectedCreatures(new Map());
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline"><Bot className="h-4 w-4 mr-2" /> Add Monster</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Monsters from Bestiary</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search monsters..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="mb-4 shrink-0"
        />
        <ScrollArea className="flex-1 border rounded-md p-2">
          <div className="space-y-1">
            {filteredCreatures.map(creature => (
              <div key={creature.id} className="flex items-center gap-3 p-2 rounded-md">
                <Input
                  type="number"
                  min="0"
                  value={selectedCreatures.get(creature.id) || 0}
                  onChange={(e) => handleQuantityChange(creature.id, parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <label htmlFor={`creature-${creature.id}`} className="flex-1">
                  <p className="font-semibold">{creature.name} <span className="text-xs text-muted-foreground">(Lvl {creature.level})</span></p>
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 shrink-0">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleAddClick} disabled={selectedCreatures.size === 0}>Add Selected</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface EncounterEditorPanelProps {
  encounterId: string | null;
  isCreatingNew: boolean;
  onEncounterSaveSuccess: (id: string) => void;
  onEncounterDeleteSuccess: () => void;
  onEditCancel: () => void;
  onRunEncounter: (id: string) => void;
  onFilterByClick: (updates: Partial<{ minTR: number; maxTR: number; tagFilter: string }>, e: React.MouseEvent) => void;
  onBack?: () => void;
  dataVersion: number;
}

const defaultValues: EncounterFormData = {
  name: "",
  sceneDescription: "",
  gmNotes: "",
  players: [],
  monsterGroups: [],
  tags: [],
  totalTR: 0,
  encounterTableId: "none",
};

export default function EncounterEditorPanel({ encounterId, isCreatingNew, onEncounterSaveSuccess, onEncounterDeleteSuccess, onEditCancel, onRunEncounter, onFilterByClick, onBack, dataVersion }: EncounterEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!encounterId);
  const [encounterData, setEncounterData] = useState<Encounter | null>(null);
  const isMobile = useIsMobile();
  
  const [viewModeDetails, setViewModeDetails] = useState<{ monsters: Map<string, Creature>, table?: EncounterTable }>({ monsters: new Map() });
  const [allCreatures, setAllCreatures] = useState<Creature[]>([]);
  const [allEncounterTables, setAllEncounterTables] = useState<EncounterTable[]>([]);

  const form = useForm<EncounterFormData>({
    resolver: zodResolver(encounterSchema),
    defaultValues,
  });

  const { fields: playerFields, append: appendPlayer, remove: removePlayer } = useFieldArray({ control: form.control, name: "players" });
  const { fields: monsterGroupFields, append: appendMonsterGroup, remove: removeMonsterGroup, update: updateMonsterGroup, replace: replaceMonsterGroups } = useFieldArray({ control: form.control, name: "monsterGroups" });
  
  const creatureTRMap = useMemo(() => new Map(allCreatures.map(c => [c.id, c.TR])), [allCreatures]);
  
  const watchedEncounterTableId = form.watch("encounterTableId");
  const watchedMonsterGroupsString = JSON.stringify(form.watch("monsterGroups"));

  useEffect(() => {
    if (watchedEncounterTableId && watchedEncounterTableId !== 'none') {
      const table = allEncounterTables.find(t => t.id === watchedEncounterTableId);
      if (table && table.totalTR !== form.getValues('totalTR')) {
        form.setValue('totalTR', table.totalTR);
      }
      if (form.getValues('monsterGroups').length > 0) {
        replaceMonsterGroups([]);
      }
    } else {
      const currentMonsterGroups: MonsterEncounterGroup[] = JSON.parse(watchedMonsterGroupsString);
      const newTotalTR = currentMonsterGroups.reduce((acc: number, group: MonsterEncounterGroup) => {
        const tr = creatureTRMap.get(group.monsterId) || 0;
        return acc + (tr * group.quantity);
      }, 0);
      if (newTotalTR !== form.getValues('totalTR')) {
          form.setValue('totalTR', newTotalTR);
      }
    }
  }, [watchedMonsterGroupsString, watchedEncounterTableId, allEncounterTables, creatureTRMap, form, replaceMonsterGroups]);

  const fetchEncounterData = useCallback(async () => {
    if (isCreatingNew) {
      form.reset(defaultValues);
      setEncounterData(null);
      setIsEditing(true);
      setLoading(false);
      const tables = await getAllEncounterTables();
      setAllEncounterTables(tables);
      return;
    }
    
    if (!encounterId) {
      setIsEditing(false);
      setLoading(false);
      setEncounterData(null);
      return;
    }

    setLoading(true);
    setIsEditing(false);
    try {
      const [encounterFromDb, tables, creatures] = await Promise.all([
        getEncounterById(encounterId),
        getAllEncounterTables(),
        getAllCreatures()
      ]);

      setAllEncounterTables(tables);
      setAllCreatures(creatures);

      if (encounterFromDb) {
         let table;
         let currentTR = encounterFromDb.totalTR || 0;
         if (encounterFromDb.encounterTableId) {
            table = tables.find(t => t.id === encounterFromDb.encounterTableId);
            if (table) {
                currentTR = table.totalTR;
            }
         }
        
         const displayData = { ...encounterFromDb, totalTR: currentTR };
         setEncounterData(displayData);

         const formData = {
          ...encounterFromDb,
          tags: encounterFromDb.tags || [],
          encounterTableId: encounterFromDb.encounterTableId || "none",
          totalTR: currentTR,
        };
        form.reset(formData);
        
        const monsterIds = (encounterFromDb.monsterGroups || []).map(g => g.monsterId);
        const creaturesForView = creatures.filter(c => monsterIds.includes(c.id));
        const creaturesMap = new Map(creaturesForView.map(c => [c.id, c]));
        setViewModeDetails({ monsters: creaturesMap, table });
        
      } else {
        setEncounterData(null);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load encounter data." });
    } finally {
      setLoading(false);
    }
  }, [encounterId, isCreatingNew, form, toast]);

  useEffect(() => {
    fetchEncounterData();
    window.addEventListener('focus', fetchEncounterData);
    return () => window.removeEventListener('focus', fetchEncounterData);
  }, [fetchEncounterData, dataVersion]);
  
  const monsterDetailsMap = useMemo(() => {
    return new Map(allCreatures.map(c => [c.id, c]));
  }, [allCreatures]);

  const handleCancel = () => {
    if (isCreatingNew) {
        onEditCancel();
    } else if (encounterData) {
        const formData = {
            ...encounterData,
            tags: encounterData.tags || [],
            encounterTableId: encounterData.encounterTableId || "none",
        };
        form.reset(formData);
        setIsEditing(false);
    }
  };

  const onSubmit = async (data: EncounterFormData) => {
    try {
      const tableId = data.encounterTableId === 'none' ? undefined : data.encounterTableId;
      const encounterToSave: Omit<Encounter, 'id'> | Encounter = {
        ...data,
        tags: data.tags || [],
        totalTR: data.totalTR,
        encounterTableId: tableId,
        monsterGroups: tableId ? [] : data.monsterGroups,
      };

      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave);
      }

      let savedId: string;
      if (isCreatingNew) {
        savedId = await addEncounter(encounterToSave as Omit<Encounter, 'id'>);
        toast({ title: "Encounter Created!", description: `${data.name} has been saved.` });
      } else if (encounterId) {
        savedId = encounterId;
        await updateEncounter({ ...encounterToSave, id: encounterId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
      } else {
        return;
      }
      onEncounterSaveSuccess(savedId);
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDelete = async () => {
    if (!encounterId) return;
    try {
      await deleteEncounter(encounterId);
      toast({ title: "Encounter Deleted", description: "The encounter has been removed." });
      onEncounterDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the encounter." });
    }
  };

  const addPlayer = () => {
    appendPlayer({
      id: crypto.randomUUID(),
      name: `Player ${playerFields.length + 1}`,
    });
  };
  
  const addMonsters = (creaturesToAdd: { id: string; name: string; quantity: number }[]) => {
    creaturesToAdd.forEach(({ id: monsterId, quantity }) => {
      const existingGroupIndex = monsterGroupFields.findIndex(group => group.monsterId === monsterId);
      if (existingGroupIndex > -1) {
        const existingGroup = monsterGroupFields[existingGroupIndex];
        updateMonsterGroup(existingGroupIndex, { ...existingGroup, quantity: existingGroup.quantity + quantity });
      } else {
        appendMonsterGroup({ monsterId, quantity });
      }
    });
  };


  if (loading) return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  
  if (!encounterId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center pt-6">
              <p className="text-xl text-muted-foreground">Select an encounter to view</p>
              <p className="text-muted-foreground">or create a new one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditing && encounterData) {
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
                                <CardTitle className="text-3xl font-bold">{encounterData.name}</CardTitle>
                                <CardDescription>
                                    <button onClick={(e) => onFilterByClick({ minTR: encounterData.totalTR || 0, maxTR: encounterData.totalTR || 0 }, e)} className="hover:underline p-0 bg-transparent text-inherit text-sm">
                                        <span className="hidden sm:inline">Total Threat Rating (TR): </span>
                                        <span className="inline sm:hidden">TR: </span>
                                        {encounterData.totalTR || 0}
                                    </button>
                                </CardDescription>
                            </div>
                        </div>
                         <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="default" size="sm" onClick={() => onRunEncounter(encounterData.id)}>
                                <Swords className="h-4 w-4"/>
                                <span className="hidden sm:inline">Run Encounter</span>
                                <span className="inline sm:hidden">Run</span>
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
                        <div>
                          <h3 className="text-lg font-semibold text-primary-foreground mb-2">Scene</h3>
                          <p className="text-foreground/80 whitespace-pre-wrap">{encounterData.sceneDescription || "No scene description."}</p>
                        </div>
                         <div>
                          <h3 className="text-lg font-semibold text-primary-foreground mb-2">GM Notes</h3>
                          <p className="text-foreground/80 whitespace-pre-wrap">{encounterData.gmNotes || "No GM notes."}</p>
                        </div>
                        <Separator/>
                         <div>
                          <h3 className="text-lg font-semibold text-primary-foreground mb-2">Combatants</h3>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-muted-foreground">Players ({(encounterData.players || []).length})</h4>
                                <ul className="space-y-2 pl-4">
                                    {(encounterData.players || []).map(p => (
                                    <li key={p.id} className="flex items-center gap-4 p-2 bg-card-foreground/5 rounded-md">
                                        <User className="h-5 w-5 text-accent" />
                                        <span className="font-semibold flex-1">{p.name}</span>
                                    </li>
                                    ))}
                                </ul>
                                <h4 className="font-semibold text-muted-foreground">Monsters</h4>
                                {encounterData.encounterTableId ? (
                                    <div className="p-2 bg-card-foreground/5 rounded-md">
                                      <p className="font-semibold">From Encounter Table: <span className="text-accent">{viewModeDetails.table?.name || '...'}</span></p>
                                      <p className="text-sm text-muted-foreground">Monsters will be rolled at the start of combat.</p>
                                    </div>
                                ) : (
                                  <ul className="space-y-2 pl-4">
                                      {(encounterData.monsterGroups || []).map(g => {
                                        const monster = viewModeDetails.monsters.get(g.monsterId);
                                        return (
                                          <li key={g.monsterId} className="flex items-center gap-4 p-2 bg-card-foreground/5 rounded-md">
                                              <Bot className="h-5 w-5 text-accent" />
                                              <span className="font-semibold flex-1">{monster?.name || 'Unknown Monster'}</span>
                                              <span className="text-sm text-muted-foreground">x {g.quantity}</span>
                                              {monster && <span className="text-sm text-muted-foreground">Lvl {monster.level} {monster.role}</span>}
                                          </li>
                                        )
                                      })}
                                  </ul>
                                )}
                            </div>
                        </div>
                        {encounterData.tags && encounterData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {encounterData.tags.map(tag => (
                                        <button key={tag} onClick={(e) => onFilterByClick({ tagFilter: tag }, e)} className="bg-transparent border-none p-0 m-0">
                                            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">{tag}</Badge>
                                        </button>
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
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{encounterData.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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
                      <CardTitle>{isCreatingNew ? (isMobile ? "New Encounter" : "Create a New Encounter") : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                    </div>
                  </div>
                  {!isMobile && (
                    <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Encounter Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
              <FormField name="sceneDescription" control={form.control} render={({ field }) => (<FormItem><FormLabel>Scene Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>)} />
              <FormField name="gmNotes" control={form.control} render={({ field }) => (<FormItem><FormLabel>GM Notes (Private)</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>)} />
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold text-primary-foreground mb-4">Combatants</h3>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-muted-foreground">Players</h4>
                      <Button type="button" size="sm" variant="outline" onClick={addPlayer}><UserPlus className="h-4 w-4 mr-2" /> Add Player</Button>
                  </div>
                  <div className="space-y-2">
                      {playerFields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card-foreground/5">
                              <FormField name={`players.${index}.name`} control={form.control} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <Button type="button" variant="ghost" size="icon" onClick={() => removePlayer(index)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                      ))}
                      {playerFields.length === 0 && <p className="text-muted-foreground text-center text-sm py-2">No players added.</p>}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-muted-foreground">Monsters</h4>
                    <FormField name="totalTR" control={form.control} render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                          <FormLabel>Total TR:</FormLabel>
                          <FormControl><Input type="number" {...field} readOnly className="w-20 bg-muted border-none" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <FormField
                    name="encounterTableId"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Encounter Table (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value)}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a table to roll from" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Manual Selection)</SelectItem>
                            {allEncounterTables.map((table) => (
                              <SelectItem key={table.id} value={table.id}>
                                {table.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(!watchedEncounterTableId || watchedEncounterTableId === 'none') && (
                    <div className="mt-4">
                      <div className="flex justify-end items-center mb-2">
                          <MonsterSelectionDialog onAddCreatures={addMonsters} />
                      </div>
                      <div className="space-y-2">
                          {monsterGroupFields.map((field, index) => {
                              const monster = monsterDetailsMap.get(field.monsterId);
                              return (
                                  <div key={field.id} className="flex items-center gap-3 p-2 border rounded-lg bg-card-foreground/5">
                                      <p className="flex-1 font-semibold">{monster?.name || 'Unknown Monster'}</p>
                                      <FormField name={`monsterGroups.${index}.quantity`} control={form.control} render={({ field: quantityField }) => (
                                      <FormItem className="flex items-center gap-2">
                                          <Label>Qty</Label>
                                          <FormControl><Input type="number" min="1" {...quantityField} className="w-20 h-8" /></FormControl>
                                      </FormItem>
                                      )} />
                                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMonsterGroup(index)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                              )
                          })}
                          {monsterGroupFields.length === 0 && <p className="text-muted-foreground text-center text-sm py-2">No monsters added.</p>}
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </CardContent>
            <CardFooter className="flex items-center gap-2">
              {!isCreatingNew && (<AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{form.getValues("name")}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
              <div className="flex-grow" />
              {!isMobile && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
              <Button type="submit">{isCreatingNew ? "Create Encounter" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
