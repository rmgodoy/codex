
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getDeedById, addDeed, updateDeed, deleteDeed, addTags } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { Deed, DeedData } from "@/lib/types";
import { DEED_ACTION_TYPES, DEED_TYPES, DEED_VERSUS } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Tag, Copy, X, ArrowLeft } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { DeedDisplay } from "./deed-display";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";

const deedEffectsSchema = z.object({
  start: z.string().optional(),
  base: z.string().optional(),
  hit: z.string().optional(),
  shadow: z.string().optional(),
  end: z.string().optional(),
});

const deedSchema = z.object({
  name: z.string().min(1, "Deed name is required"),
  tier: z.enum(['light', 'heavy', 'mighty']),
  actionType: z.enum(DEED_ACTION_TYPES),
  deedType: z.enum(DEED_TYPES),
  versus: z.enum(DEED_VERSUS),
  target: z.string().optional(),
  effects: deedEffectsSchema,
  tags: z.array(z.string()).optional(),
});

type DeedFormData = z.infer<typeof deedSchema>;

interface DeedEditorPanelProps {
  deedId: string | null;
  isCreatingNew: boolean;
  template: Partial<Deed> | null;
  onDeedSaveSuccess: (id: string) => void;
  onDeedDeleteSuccess: () => void;
  onUseAsTemplate: (deedData: Deed) => void;
  onEditCancel: () => void;
  dataVersion: number;
  onFilterByClick: (updates: { tierFilter?: 'light' | 'heavy' | 'mighty', tagFilter?: string }, e: React.MouseEvent) => void;
  onBack?: () => void;
}

const defaultValues: DeedFormData = {
  name: "",
  tier: 'light',
  actionType: 'attack',
  deedType: 'melee',
  versus: 'guard',
  target: "",
  effects: { start: '', base: '', hit: '', shadow: '', end: '' },
  tags: [],
};

export default function DeedEditorPanel({ deedId, isCreatingNew, template, onDeedSaveSuccess, onDeedDeleteSuccess, onUseAsTemplate, onEditCancel, dataVersion, onFilterByClick, onBack }: DeedEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!deedId);
  const [deedData, setDeedData] = useState<Deed | null>(null);
  const isMobile = useIsMobile();

  const form = useForm<DeedFormData>({
    resolver: zodResolver(deedSchema),
    defaultValues: template || defaultValues,
  });

  useEffect(() => {
    const fetchDeedData = async () => {
      if (isCreatingNew) {
        form.reset(template ? { ...template, tags: template.tags || []} : defaultValues);
        setDeedData(template ? (template as Deed) : null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!deedId) {
        setIsEditing(false);
        setLoading(false);
        setDeedData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const deedFromDb = await getDeedById(deedId);
        if (deedFromDb) {
          const formData = {
            ...deedFromDb,
            tags: deedFromDb.tags || [],
          };
          form.reset(formData);
          setDeedData(deedFromDb);
        } else {
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
  }, [deedId, isCreatingNew, template, form, toast, dataVersion]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
        onEditCancel();
    } else if (deedData) {
        const formData = {
            ...deedData,
            tags: deedData.tags || [],
        };
        form.reset(formData);
        setIsEditing(false);
    }
  };

  const onSubmit = async (data: DeedFormData) => {
    try {
      const deedToSave: DeedData | Deed = {
        ...data,
        tags: data.tags || [],
      };

      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave);
      }

      if (isCreatingNew) {
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

  const handleUseAsTemplate = () => {
    if (deedData) {
      onUseAsTemplate(deedData);
    }
  };
  
  if (loading) {
    return <div className="w-full max-w-5xl mx-auto"><Card>
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
    </Card></div>;
  }
  
  if (!deedId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center pt-6">
              <p className="text-xl text-muted-foreground">Select a deed to view</p>
              <p className="text-muted-foreground">or create a new one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditing && deedData) {
    return (
        <div className="relative w-full max-w-5xl mx-auto">
            {isMobile && onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="absolute left-[-0.5rem] top-7 z-10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            )}
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-3xl font-bold">{deedData.name}</CardTitle>
                        <CardDescription className="mt-1 capitalize">
                            <button onClick={(e) => onFilterByClick({ tierFilter: deedData.tier }, e)} className="hover:underline p-0 bg-transparent text-inherit">
                                {deedData.tier}
                            </button>
                        </CardDescription>
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
                </CardHeader>
                <CardContent>
                    <DeedDisplay deed={deedData} />
                     {deedData.tags && deedData.tags.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/50">
                            <div className="flex flex-wrap gap-2">
                                {deedData.tags.map(tag => (
                                    <button key={tag} onClick={(e) => onFilterByClick({ tagFilter: tag }, e)} className="bg-transparent border-none p-0 m-0">
                                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">{tag}</Badge>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
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
                </CardFooter>
            </Card>
        </div>
    );
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto">
        {isMobile && onBack && (
            <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="absolute left-[-0.5rem] top-7 z-10">
                <ArrowLeft className="h-5 w-5" />
            </Button>
        )}
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardHeader>
              <div className="flex flex-row justify-between items-start">
                  <div>
                      <CardTitle>{isCreatingNew ? (isMobile ? "New Deed" : "Create a New Deed") : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                      <CardDescription>
                        {isCreatingNew ? "Fill out the details for your new deed." : "Make your changes and click Save."}
                      </CardDescription>
                  </div>
                {!isMobile && (
                  <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="name" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Deed Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Inferno" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField name="deedType" control={form.control} render={({ field }) => (
                      <FormItem>
                          <FormLabel>Deed Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select deed type" /></SelectTrigger></FormControl>
                              <SelectContent>
                                  {DEED_TYPES.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField name="actionType" control={form.control} render={({ field }) => (
                      <FormItem>
                          <FormLabel>Action Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select action type" /></SelectTrigger></FormControl>
                              <SelectContent>
                                  {DEED_ACTION_TYPES.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField name="versus" control={form.control} render={({ field }) => (
                      <FormItem>
                          <FormLabel>Versus</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select versus" /></SelectTrigger></FormControl>
                              <SelectContent>
                                  {DEED_VERSUS.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )} />
              </div>
              
              <FormField name="target" control={form.control} render={({ field }) => (
                  <FormItem>
                      <FormLabel>Target</FormLabel>
                      <FormControl><Input placeholder="e.g., 1 Creature | Blast 4" {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )} />

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
                  <FormLabel>Hit <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                  <FormControl><Textarea placeholder="The primary effect on a successful hit..." {...field} rows={3} /></FormControl>
                  <FormMessage />
              </FormItem>
              )} />
              <FormField name="effects.shadow" control={form.control} render={({ field }) => (
              <FormItem>
                  <FormLabel>Shadow (Critical) <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
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
              {!isCreatingNew && (
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
              {!isMobile && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
              <Button type="submit">{isCreatingNew ? "Create Deed" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
