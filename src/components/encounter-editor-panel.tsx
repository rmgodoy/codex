
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getEncounterById, addEncounter, updateEncounter, deleteEncounter, getAllCreatures, getDeedsByIds } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { Encounter, Combatant, PlayerCombatant, MonsterCombatant, Creature, CreatureWithDeeds, Deed } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, X, UserPlus, Swords, Shield, Heart, Plus, ChevronsUpDown, Bot, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

const combatantStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  intensity: z.number(),
  description: z.string().optional(),
  effect: z.any().optional(),
});

const playerCombatantSchema = z.object({
  id: z.string(),
  type: z.literal('player'),
  name: z.string().min(1, "Player name is required"),
  initiative: z.coerce.number(),
  nat20: z.boolean().optional(),
});

const monsterCombatantSchema = z.object({
  id: z.string(),
  type: z.literal('monster'),
  name: z.string(),
  initiative: z.coerce.number(),
  currentHp: z.coerce.number(),
  states: z.array(combatantStateSchema),
  monsterId: z.string(),
  maxHp: z.number(),
  attributes: z.any(),
  deeds: z.array(z.any()),
  abilities: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  role: z.any(),
  level: z.number(),
  TR: z.number(),
});

const combatantSchema = z.union([playerCombatantSchema, monsterCombatantSchema]);

const encounterSchema = z.object({
  name: z.string().min(1, "Encounter name is required"),
  sceneDescription: z.string().optional(),
  gmNotes: z.string().optional(),
  combatants: z.array(combatantSchema),
});

type EncounterFormData = z.infer<typeof encounterSchema>;

const CreatureSelectionDialog = ({ onAddCreatures }: { onAddCreatures: (creatures: CreatureWithDeeds[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allCreatures, setAllCreatures] = useState<Creature[]>([]);
  const [selectedCreatureIds, setSelectedCreatureIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      getAllCreatures().then(setAllCreatures);
    }
  }, [isOpen]);

  const filteredCreatures = useMemo(() => {
    return allCreatures.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allCreatures, searchTerm]);

  const handleAddClick = async () => {
    const creaturesToAdd = allCreatures.filter(c => selectedCreatureIds.has(c.id));
    const fullCreatures = await Promise.all(creaturesToAdd.map(async c => {
      const deeds = await getDeedsByIds(c.deeds);
      return { ...c, deeds };
    }));
    onAddCreatures(fullCreatures);
    setIsOpen(false);
    setSelectedCreatureIds(new Set());
    setSearchTerm("");
  };

  const handleCheckboxChange = (creatureId: string) => {
    setSelectedCreatureIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(creatureId)) newSet.delete(creatureId);
      else newSet.add(creatureId);
      return newSet;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline"><Bot className="h-4 w-4 mr-2" /> Add Monster</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md h-[60vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Monsters from Bestiary</DialogTitle>
        </DialogHeader>
        <Input 
          placeholder="Search monsters..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[150px]"
        />
        <ScrollArea className="flex-1 border rounded-md p-4">
          <div className="space-y-2">
            {filteredCreatures.map(creature => (
              <div key={creature.id} className="flex items-center gap-3">
                <Checkbox 
                  id={`creature-${creature.id}`} 
                  onCheckedChange={() => handleCheckboxChange(creature.id)}
                  checked={selectedCreatureIds.has(creature.id)}
                />
                <label htmlFor={`creature-${creature.id}`} className="flex-1">
                  <p className="font-semibold">{creature.name} <span className="text-xs text-muted-foreground">(Lvl {creature.level})</span></p>
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleAddClick} disabled={selectedCreatureIds.size === 0}>Add Selected</Button>
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
  dataVersion: number;
  onRunEncounter: (id: string) => void;
}

const defaultValues: EncounterFormData = {
  name: "",
  sceneDescription: "",
  gmNotes: "",
  combatants: [],
};

export default function EncounterEditorPanel({ encounterId, isCreatingNew, onEncounterSaveSuccess, onEncounterDeleteSuccess, onEditCancel, dataVersion, onRunEncounter }: EncounterEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!encounterId);
  const [encounterData, setEncounterData] = useState<Encounter | null>(null);

  const form = useForm<EncounterFormData>({
    resolver: zodResolver(encounterSchema),
    defaultValues,
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "combatants",
  });
  
  const { watch } = form;
  const watchedCombatants = watch("combatants");

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
  }, [encounterId, isCreatingNew, form, toast, dataVersion]);
  
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
    const newPlayer: PlayerCombatant = {
      id: crypto.randomUUID(),
      type: 'player',
      name: `Player ${fields.filter(f => f.type === 'player').length + 1}`,
      initiative: 0,
      nat20: false,
    };
    append(newPlayer);
  };
  
  const addMonsters = (creatures: CreatureWithDeeds[]) => {
    const newMonsters: MonsterCombatant[] = creatures.map(c => {
      const existingCount = fields.filter(f => f.type === 'monster' && f.monsterId === c.id).length;
      return {
        id: crypto.randomUUID(),
        type: 'monster',
        name: `${c.name}${creatures.length > 1 || existingCount > 0 ? ` ${existingCount + 1}`: ''}`,
        initiative: c.attributes.Initiative,
        monsterId: c.id,
        maxHp: c.attributes.HP,
        currentHp: c.attributes.HP,
        attributes: c.attributes,
        deeds: c.deeds,
        abilities: c.abilities,
        description: c.description,
        tags: c.tags,
        role: c.role,
        level: c.level,
        TR: c.TR,
        states: [],
      };
    });
    append(newMonsters);
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
                      <h3 className="text-lg font-semibold text-primary-foreground mb-2">Combatants ({encounterData.combatants.length})</h3>
                      <ul className="space-y-2">
                        {encounterData.combatants.map(c => (
                          <li key={c.id} className="flex items-center gap-4 p-2 bg-card-foreground/5 rounded-md">
                            {c.type === 'player' ? <User className="h-5 w-5 text-accent" /> : <Bot className="h-5 w-5 text-accent" />}
                            <span className="font-semibold flex-1">{c.name}</span>
                            {c.type === 'monster' && <span className="text-sm text-muted-foreground">Lvl {c.level} {c.role}</span>}
                            {c.type === 'monster' && <span className="text-sm text-muted-foreground">HP: {c.currentHp}/{c.maxHp}</span>}
                          </li>
                        ))}
                      </ul>
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-primary-foreground">Combatants</h3>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={addPlayer}><UserPlus className="h-4 w-4 mr-2" /> Add Player</Button>
                  <CreatureSelectionDialog onAddCreatures={addMonsters} />
                </div>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border bg-card-foreground/5 rounded-lg p-4">
                     <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                           {field.type === 'player' ? (
                            <FormField name={`combatants.${index}.name`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Player Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                           ) : (
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-lg">{field.name}</p>
                                    <p className="text-sm text-muted-foreground">Lvl {field.level} {field.role}</p>
                                </div>
                                <div className="text-right">
                                    <Label>Initiative</Label>
                                    <p className="font-bold text-lg">{field.initiative}</p>
                                </div>
                            </div>
                           )}
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="ml-4 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                     </div>
                  </div>
                ))}
                 {fields.length === 0 && <p className="text-muted-foreground text-center py-4">No combatants added.</p>}
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
