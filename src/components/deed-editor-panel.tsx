
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getDeedById, addDeed, updateDeed, deleteDeed } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { Deed, DeedData } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Tag } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { DeedDisplay } from "./deed-display";

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
  tags: z.string().optional(),
});

type DeedFormData = z.infer<typeof deedSchema>;

interface DeedEditorPanelProps {
  deedId: string | null;
  onDeedSaveSuccess: (id: string) => void;
  onDeedDeleteSuccess: () => void;
  clearSelection: () => void;
}

const defaultValues: DeedFormData = {
  name: "",
  tier: 'light',
  type: 'attack',
  range: "",
  target: "",
  effects: { start: '', base: '', hit: '', shadow: '', end: '' },
  tags: '',
};

export default function DeedEditorPanel({ deedId, onDeedSaveSuccess, onDeedDeleteSuccess, clearSelection }: DeedEditorPanelProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(!deedId);
  const [isEditing, setIsEditing] = useState(isCreating);
  const [loading, setLoading] = useState(!!deedId);
  const [deedData, setDeedData] = useState<Deed | null>(null);

  const form = useForm<DeedFormData>({
    resolver: zodResolver(deedSchema),
    defaultValues,
  });

  useEffect(() => {
    const fetchDeedData = async () => {
      if (!deedId) {
        setIsCreating(true);
        setIsEditing(true);
        form.reset(defaultValues);
        setDeedData(null);
        setLoading(false);
        return;
      }

      setIsCreating(false);
      setLoading(true);
      setIsEditing(false);
      try {
        const deedFromDb = await getDeedById(deedId);
        if (deedFromDb) {
          const formData = {
            ...deedFromDb,
            tags: Array.isArray(deedFromDb.tags) ? deedFromDb.tags.join(', ') : '',
          };
          form.reset(formData);
          setDeedData(deedFromDb);
        } else {
          clearSelection();
          setDeedData(null);
        }
      } catch (error) {
        console.error("Failed to fetch deed data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load deed data." });
      } finally {
        setLoading(false);
      }
    };
    fetchDeedData();
  }, [deedId, form, toast, clearSelection]);
  
  const handleCancel = () => {
    if (isCreating) {
        clearSelection();
    } else if (deedData) {
        const formData = {
            ...deedData,
            tags: Array.isArray(deedData.tags) ? deedData.tags.join(', ') : '',
        };
        form.reset(formData);
        setIsEditing(false);
    }
  };

  const onSubmit = async (data: DeedFormData) => {
    try {
      const tagsValue = data.tags || '';
      const deedToSave: DeedData | Deed = {
        ...data,
        tags: tagsValue.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (isCreating) {
        const newId = await addDeed(deedToSave as DeedData);
        toast({ title: "Deed Created!", description: `${data.name} has been added to the library.` });
        onDeedSaveSuccess(newId);
      } else if (deedId) {
        await updateDeed({ ...deedToSave, id: deedId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
        onDeedSaveSuccess(deedId);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save deed:", error);
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDeleteDeed = async () => {
    if (!deedId) return;
    try {
      await deleteDeed(deedId);
      toast({ title: "Deed Deleted", description: "The deed has been removed from the library." });
      onDeedDeleteSuccess();
    } catch (error) {
      console.error("Failed to delete deed:", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the deed." });
    }
  };
  
  if (loading) {
    return <Card>
        <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Separator />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </CardContent>
    </Card>;
  }
  
  if (!deedId && !isCreating) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[300px]">
        <CardContent className="text-center pt-6">
            <p className="text-xl text-muted-foreground">Select a deed to view</p>
            <p className="text-muted-foreground">or create a new one.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isEditing && deedData) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-3xl font-bold">{deedData.name}</CardTitle>
                    <CardDescription className="mt-1 capitalize">
                       {deedData.tier} {deedData.type}
                    </CardDescription>
                </div>
                 <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-1"/> Edit</Button>
            </CardHeader>
            <CardContent>
                <DeedDisplay deed={deedData} />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardHeader>
            <CardTitle>{isCreating ? "Create a New Deed" : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
            <CardDescription>
              {isCreating ? "Fill out the details for your new deed." : "Make your changes and click Save."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel>Deed Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Inferno" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="tier" control={form.control} render={({ field }) => (
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
                <FormField name="type" control={form.control} render={({ field }) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="target" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Target</FormLabel>
                        <FormControl><Input placeholder="e.g., Spell Attack vs. Resist" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField name="range" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Range</FormLabel>
                        <FormControl><Input placeholder="e.g., Blast 4" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            <FormField name="tags" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />Tags</FormLabel>
                <FormControl><Input placeholder="e.g. fire, ongoing, control" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Separator />
            <h4 className="font-semibold text-primary-foreground">Effects</h4>
            <FormField name="effects.start" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel>Start <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                    <FormControl><Textarea placeholder="Effect when a creature starts its turn in an area..." {...field} rows={2} /></FormControl>
                </FormItem>
            )} />
            <FormField name="effects.base" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel>Base <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                    <FormControl><Textarea placeholder="Base effect of the deed..." {...field} rows={2} /></FormControl>
                </FormItem>
            )} />
            <FormField name="effects.hit" control={form.control} render={({ field }) => (
            <FormItem>
                <FormLabel>Hit <span className="text-destructive">*</span></FormLabel>
                <FormControl><Textarea placeholder="The primary effect on a successful hit..." {...field} rows={3} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
            <FormField name="effects.shadow" control={form.control} render={({ field }) => (
            <FormItem>
                <FormLabel>Shadow (Critical) <span className="text-destructive">*</span></FormLabel>
                <FormControl><Textarea placeholder="The enhanced effect on a critical success..." {...field} rows={3} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
            <FormField name="effects.end" control={form.control} render={({ field }) => (
            <FormItem>
                <FormLabel>End <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                <FormControl><Textarea placeholder="Effect at the end of a creature's turn..." {...field} rows={2} /></FormControl>
            </FormItem>
            )} />

          </CardContent>
          <CardFooter className="flex items-center gap-2">
            {!isCreating && (
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
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
                    <AlertDialogAction onClick={handleDeleteDeed} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            )}
            <div className="flex-grow" />
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit">{isCreating ? "Create Deed" : "Save Changes"}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
