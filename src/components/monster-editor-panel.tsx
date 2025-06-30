
"use client";

import { useEffect, useCallback, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, getDoc, setDoc, addDoc, deleteDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import type { Creature, Deed } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tag, Trash2, Heart, Rabbit, Zap, Crosshair, Shield, ShieldHalf, Dice5, Edit, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const deedEffectsSchema = z.object({
  start: z.string().optional(),
  base: z.string().optional(),
  hit: z.string().min(1, "Hit effect is required"),
  shadow: z.string().min(1, "Shadow effect is required"),
  end: z.string().optional(),
});

const deedSchema = z.object({
  name: z.string().min(1, "Deed name is required"),
  tier: z.enum(['light', 'heavy', 'mighty']),
  type: z.enum(['attack', 'support']),
  range: z.string().min(1, "Range is required"),
  target: z.string().min(1, "Target is required"),
  effects: deedEffectsSchema,
});

const creatureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  TR: z.coerce.number().int().min(0),
  attributes: z.object({
    HP: z.coerce.number().int().min(0),
    Speed: z.coerce.number().int().min(0),
    Initiative: z.coerce.number().int().min(0),
    Accuracy: z.coerce.number().int().min(0),
    Guard: z.coerce.number().int().min(0),
    Resist: z.coerce.number().int().min(0),
    rollBonus: z.coerce.number().int().min(0),
  }),
  deeds: z.array(deedSchema),
  abilities: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
});

type CreatureFormData = z.infer<typeof creatureSchema>;

interface CreatureEditorPanelProps {
  creatureId: string | null;
  isCreatingNew: boolean;
  onCreatureCreated: (id: string) => void;
  onCreatureDeleted: () => void;
}

const defaultValues: CreatureFormData = {
  name: "",
  TR: 1,
  attributes: { HP: 10, Speed: 6, Initiative: 1, Accuracy: 0, Guard: 10, Resist: 10, rollBonus: 0 },
  deeds: [],
  abilities: "",
  description: "",
  tags: "",
};

const DeedDisplay = ({ deed }: { deed: Deed }) => {
    const tierColors = {
        light: 'border-sky-400',
        heavy: 'border-amber-400',
        mighty: 'border-fuchsia-400',
    };
    const tierTextBg = {
        light: 'text-sky-300 bg-sky-900/50',
        heavy: 'text-amber-300 bg-amber-900/50',
        mighty: 'text-fuchsia-300 bg-fuchsia-900/50',
    }
    
    return (
        <div className={cn("rounded-lg border bg-card-foreground/5 border-l-4 p-4 mb-4", tierColors[deed.tier])}>
            <div className="flex justify-between items-baseline mb-3">
                <h4 className="text-xl font-bold">{deed.name}</h4>
                <div className={cn("text-xs font-bold uppercase px-2 py-0.5 rounded-full", tierTextBg[deed.tier])}>{deed.tier}</div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3 border-b border-t border-border py-2">
                <p><strong className="font-semibold text-foreground/80">Type:</strong> <span className="capitalize">{deed.type}</span></p>
                <p><strong className="font-semibold text-foreground/80">Range:</strong> {deed.range}</p>
                <p><strong className="font-semibold text-foreground/80">Target:</strong> {deed.target}</p>
            </div>
            
            <div className="space-y-3 text-sm">
                {deed.effects.start && <div><Label className="text-primary-foreground/90 font-semibold">Start</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{deed.effects.start}</p></div>}
                {deed.effects.base && <div><Label className="text-primary-foreground/90 font-semibold">Base</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{deed.effects.base}</p></div>}
                {deed.effects.hit && <div><Label className="text-primary-foreground font-semibold">Hit</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{deed.effects.hit}</p></div>}
                {deed.effects.shadow && <div><Label className="text-primary-foreground font-semibold">Shadow</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{deed.effects.shadow}</p></div>}
                {deed.effects.end && <div><Label className="text-primary-foreground/90 font-semibold">End</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{deed.effects.end}</p></div>}
            </div>
        </div>
    );
};


export default function CreatureEditorPanel({ creatureId, isCreatingNew, onCreatureCreated, onCreatureDeleted }: CreatureEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!creatureId);
  
  const form = useForm<CreatureFormData>({
    resolver: zodResolver(creatureSchema),
    defaultValues: defaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "deeds",
  });

  const watchedData = form.watch();
  const debouncedData = useDebounce(watchedData, 1000);

  const prepareDataForSave = (data: CreatureFormData) => {
    return {
      ...data,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
  };

  const handleUpdateCreature = useCallback(async (data: CreatureFormData) => {
    if (!creatureId || isCreatingNew) return;
    try {
      const dataToSave = prepareDataForSave(data);
      await setDoc(doc(db, "creatures", creatureId), dataToSave);
      toast({ title: "Auto-saved!", description: `${data.name} has been updated.` });
    } catch (error) {
      console.error("Failed to update creature:", error);
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes for ${data.name}.` });
    }
  }, [creatureId, isCreatingNew, toast]);
  
  useEffect(() => {
    if (!creatureId || isCreatingNew || !form.formState.isDirty || !form.formState.isValid || !isEditing) return;
    handleUpdateCreature(debouncedData);
  }, [debouncedData, creatureId, isCreatingNew, form.formState.isDirty, form.formState.isValid, handleUpdateCreature, isEditing]);


  useEffect(() => {
    const fetchCreatureData = async () => {
      if (!creatureId) {
        form.reset(defaultValues);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setIsEditing(isCreatingNew);
      try {
        const creatureDoc = await getDoc(doc(db, "creatures", creatureId));
        if (creatureDoc.exists()) {
          const data = creatureDoc.data() as Omit<Creature, 'id'>;
          const formData = {
            ...data,
            tags: data.tags ? data.tags.join(', ') : '',
          };
          form.reset(formData);
        }
      } catch (error) {
        console.error("Failed to fetch creature data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load creature data." });
      } finally {
        setLoading(false);
      }
    };
    fetchCreatureData();
  }, [creatureId, form, toast, isCreatingNew]);


  const handleCreateCreature = async (data: CreatureFormData) => {
    try {
      const dataToSave = prepareDataForSave(data);
      const newDocRef = await addDoc(collection(db, "creatures"), dataToSave);
      toast({ title: "Creature Created!", description: `${data.name} has been added to the bestiary.` });
      onCreatureCreated(newDocRef.id);
    } catch (error) {
      console.error("Failed to create creature:", error);
      toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new creature." });
    }
  };

  const handleDeleteCreature = async () => {
    if (!creatureId) return;
    try {
      await deleteDoc(doc(db, "creatures", creatureId));
      toast({ title: "Creature Deleted", description: "The creature has been removed from the bestiary." });
      onCreatureDeleted();
    } catch (error) {
      console.error("Failed to delete creature:", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the creature." });
    }
  };
  
  const creatureData = form.getValues();

  if (loading && !isCreatingNew) {
     return (
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-24" />
        </CardHeader>
        <CardContent>
            <Separator className="my-6"/>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
            <Separator className="my-6"/>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </CardContent>
       </Card>
     );
  }

  if (!isCreatingNew && !creatureId && !loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center pt-6">
            <p className="text-xl text-muted-foreground">Select a creature to view</p>
            <p className="text-muted-foreground">or create a new one.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!isEditing && creatureId) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-3xl font-bold">{creatureData.name}</CardTitle>
                    <CardDescription className="mt-1">
                        TR {creatureData.TR}
                        {creatureData.tags && ` • ${creatureData.tags}`}
                    </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)}><Edit/> Edit</Button>
            </CardHeader>
            <CardContent>
                <Separator className="my-6"/>
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary-foreground">Attributes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2"><Heart className="h-5 w-5 text-accent"/><div><Label>HP</Label><p className="text-lg font-bold">{creatureData.attributes.HP}</p></div></div>
                    <div className="flex items-center gap-2"><Rabbit className="h-5 w-5 text-accent"/><div><Label>Speed</Label><p className="text-lg font-bold">{creatureData.attributes.Speed}</p></div></div>
                    <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-accent"/><div><Label>Initiative</Label><p className="text-lg font-bold">{creatureData.attributes.Initiative}</p></div></div>
                    <div className="flex items-center gap-2"><Crosshair className="h-5 w-5 text-accent"/><div><Label>Accuracy</Label><p className="text-lg font-bold">{creatureData.attributes.Accuracy}</p></div></div>
                    <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-accent"/><div><Label>Guard</Label><p className="text-lg font-bold">{creatureData.attributes.Guard}</p></div></div>
                    <div className="flex items-center gap-2"><ShieldHalf className="h-5 w-5 text-accent"/><div><Label>Resist</Label><p className="text-lg font-bold">{creatureData.attributes.Resist}</p></div></div>
                    <div className="flex items-center gap-2"><Dice5 className="h-5 w-5 text-accent"/><div><Label>Roll Bonus</Label><p className="text-lg font-bold">{creatureData.attributes.rollBonus}</p></div></div>
                  </div>
                </div>
                <Separator className="my-6"/>
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-primary-foreground">Deeds</h3>
                    {creatureData.deeds.length > 0 ? (
                        creatureData.deeds.map((deed, i) => <DeedDisplay key={i} deed={deed as Deed} />)
                    ) : (
                        <p className="text-muted-foreground">No deeds defined.</p>
                    )}
                </div>
                {(creatureData.abilities || creatureData.description) && <Separator className="my-6"/>}
                {creatureData.abilities && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-primary-foreground">Abilities</h3>
                        <p className="text-foreground/90 whitespace-pre-wrap">{creatureData.abilities}</p>
                    </div>
                )}
                {creatureData.description && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2 text-primary-foreground">Description</h3>
                        <p className="text-foreground/90 whitespace-pre-wrap">{creatureData.description}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="justify-end">
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Creature
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{form.getValues("name")}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteCreature} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isCreatingNew ? "Create a New Creature" : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
        <CardDescription>
          {isCreatingNew ? "Fill out the details for your new creature." : "Changes are saved automatically."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateCreature)} className="space-y-8">
            <div className="grid md:grid-cols-3 gap-4">
              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Gloomfang Serpent" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="TR" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>TR</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary-foreground">Attributes</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField name="attributes.HP" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Heart className="h-4 w-4 text-accent" />HP</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="attributes.Speed" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Rabbit className="h-4 w-4 text-accent" />Speed</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="attributes.Initiative" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent" />Initiative</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="attributes.Accuracy" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Crosshair className="h-4 w-4 text-accent" />Accuracy</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                 <FormField name="attributes.Guard" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Shield className="h-4 w-4 text-accent" />Guard</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="attributes.Resist" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><ShieldHalf className="h-4 w-4 text-accent" />Resist</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                 <FormField name="attributes.rollBonus" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Dice5 className="h-4 w-4 text-accent" />Roll Bonus</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-primary-foreground">Deeds</h3>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ name: '', tier: 'light', type: 'attack', range: '', target: '', effects: { start: '', base: '', hit: '', shadow: '', end: '' } })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Deed
                </Button>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                    <Collapsible key={field.id} defaultOpen={!form.getValues(`deeds.${index}.name`)} className="border bg-card-foreground/5 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <CollapsibleTrigger asChild>
                                <button type="button" className="flex items-center gap-3 text-left w-full">
                                    <ChevronsUpDown className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-lg font-semibold text-primary-foreground">
                                        {watchedData.deeds?.[index]?.name || "New Deed"}
                                    </span>
                                </button>
                            </CollapsibleTrigger>
                             <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <CollapsibleContent className="mt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField name={`deeds.${index}.name`} control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deed Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Inferno" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name={`deeds.${index}.tier`} control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tier</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="light">Light</SelectItem>
                                                <SelectItem value="heavy">Heavy</SelectItem>
                                                <SelectItem value="mighty">Mighty</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name={`deeds.${index}.type`} control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="attack">Attack</SelectItem>
                                                <SelectItem value="support">Support</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <FormField name={`deeds.${index}.target`} control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target</FormLabel>
                                        <FormControl><Input placeholder="e.g., Spell Attack vs. Resist" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name={`deeds.${index}.range`} control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Range</FormLabel>
                                        <FormControl><Input placeholder="e.g., Blast 4" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="mt-4 space-y-4">
                            <h4 className="font-semibold text-sm text-primary-foreground">Effects</h4>
                            <FormField name={`deeds.${index}.effects.start`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                                    <FormControl><Textarea placeholder="Effect when a creature starts its turn in an area..." {...field} rows={2} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField name={`deeds.${index}.effects.base`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Base <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                                    <FormControl><Textarea placeholder="Base effect of the deed..." {...field} rows={2} /></FormControl>
                                </FormItem>
                            )} />
                                <FormField name={`deeds.${index}.effects.hit`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hit <span className="text-destructive">*</span></FormLabel>
                                    <FormControl><Textarea placeholder="The primary effect on a successful hit..." {...field} rows={3} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )} />
                                <FormField name={`deeds.${index}.effects.shadow`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Shadow (Critical) <span className="text-destructive">*</span></FormLabel>
                                    <FormControl><Textarea placeholder="The enhanced effect on a critical success..." {...field} rows={3} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )} />
                                <FormField name={`deeds.${index}.effects.end`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                                    <FormControl><Textarea placeholder="Effect at the end of a creature's turn..." {...field} rows={2} /></FormControl>
                                </FormItem>
                                )} />
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
              </div>
            </div>

            <Separator />

            <FormField name="abilities" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Abilities</FormLabel>
                  <FormControl><Textarea placeholder="Special abilities, separated by commas..." {...field} /></FormControl>
                </FormItem>
              )} />
            <FormField name="description" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="A short description of the creature..." rows={5} {...field} /></FormControl>
                </FormItem>
              )} />
            <FormField name="tags" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />Tags</FormLabel>
                <FormControl><Input placeholder="e.g. undead, magical, small" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <div className="flex justify-end gap-2 pt-4">
              {!isCreatingNew && (
                <>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{form.getValues("name")}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteCreature} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </>
              )}
              {isCreatingNew && <Button type="submit">Save New Creature</Button>}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
