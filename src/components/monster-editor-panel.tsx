
"use client";

import { useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, getDoc, setDoc, addDoc, deleteDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import type { Creature } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tag, Trash2, Heart, Rabbit, Zap, Crosshair, Shield, ShieldHalf, Dice5 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function CreatureEditorPanel({ creatureId, isCreatingNew, onCreatureCreated, onCreatureDeleted }: CreatureEditorPanelProps) {
  const { toast } = useToast();
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
    if (!creatureId || isCreatingNew || !form.formState.isDirty || !form.formState.isValid) return;
    handleUpdateCreature(debouncedData);
  }, [debouncedData, creatureId, isCreatingNew, form.formState.isDirty, form.formState.isValid, handleUpdateCreature]);


  useEffect(() => {
    const fetchCreatureData = async () => {
      if (!creatureId) {
        form.reset(defaultValues);
        return;
      }
      form.reset(undefined, { keepValues: false }); 
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
      }
    };
    fetchCreatureData();
  }, [creatureId, form, toast]);


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

  if (!isCreatingNew && !creatureId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
            <p className="text-xl text-muted-foreground">Select a creature to edit</p>
            <p className="text-muted-foreground">or create a new one.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!isCreatingNew && form.formState.isSubmitting) {
     return (
       <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
       </Card>
     )
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 relative bg-card-foreground/5">
                     <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
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

                  </Card>
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
              )}
              {isCreatingNew && <Button type="submit">Save New Creature</Button>}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
