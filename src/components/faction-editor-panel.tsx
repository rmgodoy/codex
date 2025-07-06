
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getFactionById, addFaction, updateFaction, deleteFaction, addTags } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { Faction, NewFaction } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, Tag, X, ArrowLeft } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";

const factionSchema = z.object({
  name: z.string().min(1, "Faction name is required"),
  description: z.string().optional(),
  goals: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type FactionFormData = z.infer<typeof factionSchema>;

interface FactionEditorPanelProps {
  factionId: string | null;
  isCreatingNew: boolean;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onEditCancel: () => void;
  onBack?: () => void;
}

const defaultValues: FactionFormData = {
  name: "",
  description: "",
  goals: "",
  tags: [],
};

export default function FactionEditorPanel({ factionId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onBack }: FactionEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!factionId);
  const [factionData, setFactionData] = useState<Faction | null>(null);
  const isMobile = useIsMobile();

  const form = useForm<FactionFormData>({
    resolver: zodResolver(factionSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    const fetchFactionData = async () => {
      if (isCreatingNew) {
        form.reset(defaultValues);
        setFactionData(null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!factionId) {
        setIsEditing(false);
        setLoading(false);
        setFactionData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const factionFromDb = await getFactionById(factionId);
        if (factionFromDb) {
          form.reset(factionFromDb);
          setFactionData(factionFromDb);
        } else {
          setFactionData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load faction data." });
      } finally {
        setLoading(false);
      }
    };
    fetchFactionData();
  }, [factionId, isCreatingNew, form, toast]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
      onEditCancel();
    } else if (factionData) {
      form.reset(factionData);
      setIsEditing(false);
    }
  };

  const onSubmit = async (data: FactionFormData) => {
    try {
      const factionToSave: NewFaction | Faction = {
        ...data,
        tags: data.tags || [],
      };

      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave, 'faction');
      }

      if (isCreatingNew) {
        const newId = await addFaction(factionToSave as NewFaction);
        toast({ title: "Faction Created!", description: `${data.name} has been added.` });
        onSaveSuccess(newId);
      } else if (factionId) {
        await updateFaction({ ...factionToSave, id: factionId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
        onSaveSuccess(factionId);
      }
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDelete = async () => {
    if (!factionId) return;
    try {
      await deleteFaction(factionId);
      toast({ title: "Faction Deleted", description: "The faction has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the faction." });
    }
  };

  if (loading) {
    return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  }
  
  if (!factionId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center pt-6">
              <p className="text-xl text-muted-foreground">Select a faction to view</p>
              <p className="text-muted-foreground">or create a new one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditing && factionData) {
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
                                <CardTitle className="text-3xl font-bold">{factionData.name}</CardTitle>
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
                        <div>
                          <h3 className="text-lg font-semibold text-primary-foreground mb-2">Description</h3>
                          <p className="text-foreground/80 whitespace-pre-wrap">{factionData.description || "No description provided."}</p>
                        </div>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-semibold text-primary-foreground mb-2">Goals</h3>
                          <p className="text-foreground/80 whitespace-pre-wrap">{factionData.goals || "No goals provided."}</p>
                        </div>

                        {factionData.tags && factionData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {factionData.tags.map(tag => (
                                        <Badge key={tag} variant="secondary">{tag}</Badge>
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
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{factionData.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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
                      <CardTitle>{isCreatingNew ? (isMobile ? "New Faction" : "Create New Faction") : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                    </div>
                  </div>
                  {!isMobile && (
                      <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>)} />
                <FormField name="goals" control={form.control} render={({ field }) => (<FormItem><FormLabel>Goals</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl></FormItem>)} />
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
                                tagSource="faction"
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
              <Button type="submit">{isCreatingNew ? "Create Faction" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
