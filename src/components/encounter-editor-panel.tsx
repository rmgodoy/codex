
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getEncounterById, addEncounter, updateEncounter, deleteEncounter, getAllCreatures, getDeedsByIds, getCreaturesByIds, getCreatureById } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { Encounter, Creature, CreatureWithDeeds, Deed, MonsterEncounterGroup, PlayerEncounterEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, X, UserPlus, Swords, Bot, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

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
}

const defaultValues: EncounterFormData = {
  name: "",
  sceneDescription: "",
  gmNotes: "",
  players: [],
  monsterGroups: [],
};

export default function EncounterEditorPanel({ encounterId, isCreatingNew, onEncounterSaveSuccess, onEncounterDeleteSuccess, onEditCancel, onRunEncounter }: EncounterEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!encounterId);
  const [encounterData, setEncounterData] = useState<Encounter | null>(null);
  
  // For view mode display
  const [viewModeDetails, setViewModeDetails] = useState<{ totalTR: number; monsters: Map<string, Creature> }>({ totalTR: 0, monsters: new Map() });

  const form = useForm<EncounterFormData>({
    resolver: zodResolver(encounterSchema),
    defaultValues,
  });

  const { fields: playerFields, append: appendPlayer, remove: removePlayer } = useFieldArray({ control: form.control, name: "players" });
  const { fields: monsterGroupFields, append: appendMonsterGroup, remove: removeMonsterGroup, update: updateMonsterGroup } = useFieldArray({ control: form.control, name: "monsterGroups" });
  
  const [allCreatures, setAllCreatures] = useState<Creature[]>([]);
  useEffect(() => {
    getAllCreatures().then(setAllCreatures);
  }, []);

  const monsterDetailsMap = useMemo(() => {
    return new Map(allCreatures.map(c => [c.id, c]));
  }, [allCreatures]);


  useEffect(() => {
    const fetchEncounterData = async () => {
      if (isCreatingNew) {
        form.reset(defaultValues);
        setEncounterData(null);
        setIsEditing(true);
        setLoading(false);
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
        const encounterFromDb = await getEncounterById(encounterId);
        if (encounterFromDb) {
          form.reset(encounterFromDb);
          setEncounterData(encounterFromDb);
          
          const monsterIds = encounterFromDb.monsterGroups.map(g => g.monsterId);
          if (monsterIds.length > 0) {
            const creatures = await getCreaturesByIds(monsterIds);
            const creaturesMap = new Map(creatures.map(c => [c.id, c]));
            const totalTR = encounterFromDb.monsterGroups.reduce((acc, group) => {
              const creature = creaturesMap.get(group.monsterId);
              return acc + (creature ? creature.TR * group.quantity : 0);
            }, 0);
            setViewModeDetails({ totalTR, monsters: creaturesMap });
          } else {
            setViewModeDetails({ totalTR: 0, monsters: new Map() });
          }
          
        } else {
          setEncounterData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load encounter data." });
      } finally {
        setLoading(false);
      }
    };
    fetchEncounterData();
  }, [encounterId, isCreatingNew, form, toast]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
        onEditCancel();
    } else if (encounterData) {
        form.reset(encounterData);
        setIsEditing(false);
    }
  };

  const onSubmit = async (data: EncounterFormData) => {
    try {
      if (isCreatingNew) {
        const newId = await addEncounter(data);
        toast({ title: "Encounter Created!", description: `${data.name} has been saved.` });
        onEncounterSaveSuccess(newId);
      } else if (encounterId) {
        await updateEncounter({ ...data, id: encounterId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
        onEncounterSaveSuccess(encounterId);
      }
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


  if (loading) return <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>;
  
  if (!encounterId && !isCreatingNew) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[300px]">
        <CardContent className="text-center pt-6">
            <p className="text-xl text-muted-foreground">Select an encounter to view</p>
            <p className="text-muted-foreground">or create a new one.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isEditing && encounterData) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-3xl font-bold">{encounterData.name}</CardTitle>
                    <CardDescription>Total Threat Rating (TR): {viewModeDetails.totalTR}</CardDescription>
                </div>
                 <div className="flex gap-2">
                    <Button variant="default" size="sm" onClick={() => onRunEncounter(encounterData.id)}><Swords className="h-4 w-4 mr-1"/> Run Encounter</Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-1"/> Edit</Button>
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
                            <ul className="space-y-2 pl-4">
                                {encounterData.monsterGroups.map(g => {
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
                        </div>
                    </div>
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
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle>{isCreatingNew ? "Create a New Encounter" : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
            </div>
             <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Encounter Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField name="sceneDescription" control={form.control} render={({ field }) => (<FormItem><FormLabel>Scene Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>)} />
            <FormField name="gmNotes" control={form.control} render={({ field }) => (<FormItem><FormLabel>GM Notes (Private)</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>)} />
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold text-primary-foreground mb-4">Combatants</h3>
              
              {/* Players */}
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
              
              {/* Monsters */}
              <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-muted-foreground">Monsters</h4>
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

            </div>

          </CardContent>
          <CardFooter className="flex items-center gap-2">
            {!isCreatingNew && (<AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{form.getValues("name")}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
            <div className="flex-grow" />
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit">{isCreatingNew ? "Create Encounter" : "Save Changes"}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
