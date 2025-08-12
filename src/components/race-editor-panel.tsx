
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getRaceById, addRace, updateRace, deleteRace, addTags } from "@/lib/idb";
import type { Race, NewRace, RaceTrait } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, Tag, X, ArrowLeft, Plus } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";

const raceTraitSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Trait title is required"),
  description: z.string().min(1, "Trait description is required"),
});

const raceSchema = z.object({
  name: z.string().min(1, "Race name is required"),
  appearance: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  traits: z.array(raceTraitSchema).optional(),
  tags: z.array(z.string()).optional(),
});

type RaceFormData = z.infer<typeof raceSchema>;

interface RaceEditorPanelProps {
  raceId: string | null;
  isCreatingNew: boolean;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onEditCancel: () => void;
  onBack?: () => void;
  dataVersion: number;
}

const defaultValues: RaceFormData = {
  name: "",
  appearance: "",
  location: "",
  description: "",
  traits: [],
  tags: [],
};

export default function RaceEditorPanel({ raceId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onBack, dataVersion }: RaceEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!raceId);
  const [raceData, setRaceData] = useState<Race | null>(null);
  const isMobile = useIsMobile();

  const form = useForm<RaceFormData>({
    resolver: zodResolver(raceSchema),
    defaultValues: defaultValues,
  });

  const { fields: traitFields, append: appendTrait, remove: removeTrait } = useFieldArray({
    control: form.control,
    name: "traits",
  });

  useEffect(() => {
    const fetchRaceData = async () => {
      if (isCreatingNew) {
        form.reset(defaultValues);
        setRaceData(null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!raceId) {
        setIsEditing(false);
        setLoading(false);
        setRaceData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const raceFromDb = await getRaceById(raceId);
        if (raceFromDb) {
          form.reset(raceFromDb);
          setRaceData(raceFromDb);
        } else {
          setRaceData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load race data." });
      } finally {
        setLoading(false);
      }
    };
    fetchRaceData();
  }, [raceId, isCreatingNew, form, toast, dataVersion]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
        onEditCancel();
    } else if (raceData) {
        form.reset(raceData);
        setIsEditing(false);
    }
  };

  const onSubmit = async (data: RaceFormData) => {
    try {
      const raceToSave: NewRace | Race = {
        ...data,
        tags: data.tags || [],
        traits: data.traits || [],
      };

      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave, 'race');
      }

      if (isCreatingNew) {
        const newId = await addRace(raceToSave as NewRace);
        toast({ title: "Race Created!", description: `${data.name} has been added.` });
        onSaveSuccess(newId);
      } else if (raceId) {
        await updateRace({ ...raceToSave, id: raceId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
        onSaveSuccess(raceId);
      }
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDelete = async () => {
    if (!raceId) return;
    try {
      await deleteRace(raceId);
      toast({ title: "Race Deleted", description: "The race has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the race." });
    }
  };

  if (loading) {
    return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  }
  
  if (!raceId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center pt-6">
              <p className="text-xl text-muted-foreground">Select a race to view</p>
              <p className="text-muted-foreground">or create a new one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditing && raceData) {
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
                                <CardTitle className="text-3xl font-bold">{raceData.name}</CardTitle>
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
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">General Description</h3><p className="text-foreground/80 whitespace-pre-wrap">{raceData.description || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">General Appearance</h3><p className="text-foreground/80 whitespace-pre-wrap">{raceData.appearance || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">Typical Location</h3><p className="text-foreground/80 whitespace-pre-wrap">{raceData.location || "Not specified."}</p></div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Traits</h3>
                            {raceData.traits.length > 0 ? (
                                <ul className="space-y-2">
                                    {raceData.traits.map(trait => (
                                        <li key={trait.id}><span className="font-bold">{trait.title}:</span> {trait.description}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No traits defined.</p>
                            )}
                        </div>
                        {raceData.tags && raceData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {raceData.tags.map(tag => (
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
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{raceData.name}".</AlertDialogDescription></AlertDialogHeader>
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
                      <CardTitle>{isCreatingNew ? (isMobile ? "New Race" : "Create New Race") : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                    </div>
                  </div>
                  {!isMobile && (
                      <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>General Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>)} />
                <FormField name="appearance" control={form.control} render={({ field }) => (<FormItem><FormLabel>General Appearance</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>)} />
                <FormField name="location" control={form.control} render={({ field }) => (<FormItem><FormLabel>Typical Location</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl></FormItem>)} />
                
                <Separator />
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Traits</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => appendTrait({ id: crypto.randomUUID(), title: "", description: "" })}>
                      <Plus className="h-4 w-4 mr-2" /> Add Trait
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {traitFields.map((field, index) => (
                      <div key={field.id} className="border p-4 rounded-md bg-muted/50 space-y-3 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeTrait(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <FormField name={`traits.${index}.title`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name={`traits.${index}.description`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    ))}
                    {traitFields.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No traits added yet.</p>}
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
                                tagSource="race"
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
              <Button type="submit">{isCreatingNew ? "Create Race" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
