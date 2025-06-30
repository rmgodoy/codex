"use client";

import { useEffect, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, getDoc, setDoc, addDoc, deleteDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import type { Monster } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BrainCircuit, Plus, Sparkles, Sword, Trash2, Wind, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const monsterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  level: z.coerce.number().int().min(0),
  attributes: z.object({
    strength: z.coerce.number().int().min(0),
    agility: z.coerce.number().int().min(0),
    mind: z.coerce.number().int().min(0),
    charm: z.coerce.number().int().min(0),
  }),
  skills: z.array(z.object({
    name: z.string().min(1, "Skill name is required"),
    rating: z.coerce.number().int().min(0),
  })),
  abilities: z.string().optional(),
  description: z.string().optional(),
});

type MonsterFormData = z.infer<typeof monsterSchema>;

interface MonsterEditorPanelProps {
  monsterId: string | null;
  isCreatingNew: boolean;
  onMonsterCreated: (id: string) => void;
  onMonsterDeleted: () => void;
}

const defaultValues: MonsterFormData = {
  name: "",
  level: 1,
  attributes: { strength: 1, agility: 1, mind: 1, charm: 1 },
  skills: [],
  abilities: "",
  description: "",
};

export default function MonsterEditorPanel({ monsterId, isCreatingNew, onMonsterCreated, onMonsterDeleted }: MonsterEditorPanelProps) {
  const { toast } = useToast();
  const form = useForm<MonsterFormData>({
    resolver: zodResolver(monsterSchema),
    defaultValues: defaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const watchedData = form.watch();
  const debouncedData = useDebounce(watchedData, 1000);

  const handleUpdateMonster = useCallback(async (data: MonsterFormData) => {
    if (!monsterId || isCreatingNew) return;
    try {
      await setDoc(doc(db, "monsters", monsterId), data);
      toast({ title: "Auto-saved!", description: `${data.name} has been updated.` });
    } catch (error) {
      console.error("Failed to update monster:", error);
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes for ${data.name}.` });
    }
  }, [monsterId, isCreatingNew, toast]);
  
  useEffect(() => {
    if (!monsterId || isCreatingNew || !form.formState.isDirty || !form.formState.isValid) return;
    handleUpdateMonster(debouncedData);
  }, [debouncedData, monsterId, isCreatingNew, form.formState.isDirty, form.formState.isValid, handleUpdateMonster]);


  useEffect(() => {
    const fetchMonsterData = async () => {
      if (!monsterId) {
        form.reset(defaultValues);
        return;
      }
      form.reset(undefined, { keepValues: false }); // Reset to show loading state
      try {
        const monsterDoc = await getDoc(doc(db, "monsters", monsterId));
        if (monsterDoc.exists()) {
          const data = monsterDoc.data() as Omit<Monster, 'id'>;
          form.reset(data);
        }
      } catch (error) {
        console.error("Failed to fetch monster data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load monster data." });
      }
    };
    fetchMonsterData();
  }, [monsterId, form, toast]);


  const handleCreateMonster = async (data: MonsterFormData) => {
    try {
      const newDocRef = await addDoc(collection(db, "monsters"), data);
      toast({ title: "Monster Created!", description: `${data.name} has been added to the bestiary.` });
      onMonsterCreated(newDocRef.id);
    } catch (error) {
      console.error("Failed to create monster:", error);
      toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new monster." });
    }
  };

  const handleDeleteMonster = async () => {
    if (!monsterId) return;
    try {
      await deleteDoc(doc(db, "monsters", monsterId));
      toast({ title: "Monster Deleted", description: "The monster has been removed from the bestiary." });
      onMonsterDeleted();
    } catch (error) {
      console.error("Failed to delete monster:", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the monster." });
    }
  };

  if (!isCreatingNew && !monsterId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
            <p className="text-xl text-muted-foreground">Select a monster to edit</p>
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
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle>{isCreatingNew ? "Create a New Monster" : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
        <CardDescription>
          {isCreatingNew ? "Fill out the details for your new creature." : "Changes are saved automatically."}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-100px)] overflow-y-auto pr-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateMonster)} className="space-y-8">
            <div className="grid md:grid-cols-3 gap-4">
              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Gloomfang Serpent" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="level" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary-foreground">Attributes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField name="attributes.strength" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Sword className="h-4 w-4 text-accent" />Strength</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="attributes.agility" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Wind className="h-4 w-4 text-accent" />Agility</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="attributes.mind" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-accent" />Mind</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="attributes.charm" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" />Charm</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-primary-foreground">Skills</h3>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ name: '', rating: 1 })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Skill
                </Button>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField name={`skills.${index}.name`} control={form.control} render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl><Input placeholder="Skill name" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField name={`skills.${index}.rating`} control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormControl><Input type="number" className="w-20" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
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
                  <FormControl><Textarea placeholder="A short description of the monster..." rows={5} {...field} /></FormControl>
                </FormItem>
              )} />
            
            <div className="flex justify-end gap-2 pt-4">
              {!isCreatingNew && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Monster
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
                      <AlertDialogAction onClick={handleDeleteMonster} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {isCreatingNew && <Button type="submit">Save New Monster</Button>}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
