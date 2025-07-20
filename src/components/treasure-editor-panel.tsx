
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getTreasureById, addTreasure, updateTreasure, deleteTreasure, addTags } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { Treasure, NewTreasure } from "@/lib/types";
import { generateRandomTreasure } from "@/lib/treasure-generator";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, Tag, X, ArrowLeft, Dices } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";

const treasureSchema = z.object({
  name: z.string().min(1, "Treasure name is required"),
  description: z.string().optional(),
  material: z.string().min(1, "Material is required"),
  gemstone: z.string().min(1, "Gemstone is required"),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  slots: z.string().min(1, "Slots are required"),
  tags: z.array(z.string()).optional(),
  isGenerated: z.boolean(),
});

type TreasureFormData = z.infer<typeof treasureSchema>;

interface TreasureEditorPanelProps {
  treasureId: string | null;
  isCreatingNew: boolean;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onEditCancel: () => void;
  onBack?: () => void;
}

const defaultValues: TreasureFormData = {
  name: "",
  description: "",
  material: "",
  gemstone: "",
  value: 0,
  slots: "1",
  tags: [],
  isGenerated: false,
};

export default function TreasureEditorPanel({ treasureId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onBack }: TreasureEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!treasureId);
  const [treasureData, setTreasureData] = useState<Treasure | null>(null);
  const isMobile = useIsMobile();

  const form = useForm<TreasureFormData>({
    resolver: zodResolver(treasureSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    const fetchTreasureData = async () => {
      if (isCreatingNew) {
        form.reset(defaultValues);
        setTreasureData(null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!treasureId) {
        setIsEditing(false);
        setLoading(false);
        setTreasureData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const treasureFromDb = await getTreasureById(treasureId);
        if (treasureFromDb) {
          form.reset(treasureFromDb);
          setTreasureData(treasureFromDb);
        } else {
          setTreasureData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load treasure data." });
      } finally {
        setLoading(false);
      }
    };
    fetchTreasureData();
  }, [treasureId, isCreatingNew, form, toast]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
        onEditCancel();
    } else if (treasureData) {
        form.reset(treasureData);
        setIsEditing(false);
    }
  };

  const onSubmit = async (data: TreasureFormData) => {
    try {
      const treasureToSave: NewTreasure | Treasure = {
        ...data,
        description: data.description || '',
        tags: data.tags || [],
      };

      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave, 'treasure');
      }

      if (isCreatingNew) {
        const newId = await addTreasure(treasureToSave as NewTreasure);
        toast({ title: "Treasure Created!", description: `${data.name} has been added.` });
        onSaveSuccess(newId);
      } else if (treasureId) {
        await updateTreasure({ ...treasureToSave, id: treasureId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
        onSaveSuccess(treasureId);
      }
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDelete = async () => {
    if (!treasureId) return;
    try {
      await deleteTreasure(treasureId);
      toast({ title: "Treasure Deleted", description: "The treasure has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the treasure." });
    }
  };

  const handleGenerate = () => {
    const generated = generateRandomTreasure();
    form.reset({
        ...form.getValues(),
        ...generated,
        isGenerated: true,
    });
    toast({ title: "Treasure Generated!", description: "Review and save the new treasure." });
  };
  
  if (loading) {
    return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  }
  
  if (!treasureId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center pt-6">
              <p className="text-xl text-muted-foreground">Select a treasure to view</p>
              <p className="text-muted-foreground">or create a new one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditing && treasureData) {
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
                                <CardTitle className="text-3xl font-bold">{treasureData.name}</CardTitle>
                                <CardDescription>A treasure of value {treasureData.value}</CardDescription>
                            </div>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4"/>
                            <span className="hidden sm:inline ml-2">Edit</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-foreground/80 whitespace-pre-wrap">{treasureData.description || "No description provided."}</p>
                        <Separator />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div><span className="font-semibold text-muted-foreground">Material:</span> {treasureData.material}</div>
                            <div><span className="font-semibold text-muted-foreground">Gemstone:</span> {treasureData.gemstone}</div>
                            <div><span className="font-semibold text-muted-foreground">Slots:</span> {treasureData.slots}</div>
                        </div>

                        {treasureData.tags && treasureData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {treasureData.tags.map(tag => (
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
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{treasureData.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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
                      <CardTitle>{isCreatingNew ? (isMobile ? "New Treasure" : "Create New Treasure") : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCreatingNew && (
                        <Button type="button" variant="outline" size="sm" onClick={handleGenerate}><Dices className="h-4 w-4 mr-2" /> Generate</Button>
                    )}
                    {!isMobile && (
                        <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
                    )}
                  </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name (Form Factor)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="material" control={form.control} render={({ field }) => (<FormItem><FormLabel>Material</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="gemstone" control={form.control} render={({ field }) => (<FormItem><FormLabel>Gemstone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="value" control={form.control} render={({ field }) => (<FormItem><FormLabel>Value</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="slots" control={form.control} render={({ field }) => (<FormItem><FormLabel>Slots</FormLabel><FormControl><Input {...field} placeholder="e.g., tiny or 2" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>)} />
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
                                tagSource="treasure"
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
              <Button type="submit">{isCreatingNew ? "Create Treasure" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
