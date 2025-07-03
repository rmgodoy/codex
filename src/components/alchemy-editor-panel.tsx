

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAlchemicalItemById, addAlchemicalItem, updateAlchemicalItem, deleteAlchemicalItem, addTags } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { AlchemicalItem, NewAlchemicalItem } from "@/lib/types";
import { ALCHEMY_ITEM_TYPES, ALCHEMY_ITEM_TIERS } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Tag, X, ArrowLeft, FlaskConical } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  type: z.enum(ALCHEMY_ITEM_TYPES),
  tier: z.enum(ALCHEMY_ITEM_TIERS),
  cost: z.coerce.number().min(1, "Cost must be at least 1"),
  effect: z.string().min(1, "Effect is required"),
  tags: z.array(z.string()).optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface AlchemyEditorPanelProps {
  itemId: string | null;
  isCreatingNew: boolean;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onEditCancel: () => void;
  onFilterByClick: (updates: { typeFilter?: string; tierFilter?: string; tagFilter?: string }, e: React.MouseEvent) => void;
  onBack?: () => void;
}

const defaultValues: ItemFormData = {
  name: "",
  type: 'potion',
  tier: 'lesser',
  cost: 2,
  effect: "",
  tags: [],
};

export default function AlchemyEditorPanel({ itemId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onFilterByClick, onBack }: AlchemyEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!itemId);
  const [itemData, setItemData] = useState<AlchemicalItem | null>(null);
  const isMobile = useIsMobile();

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultValues,
  });
  
  const watchedTier = form.watch('tier');
  
  useEffect(() => {
    if (isEditing) {
        const newCost = watchedTier === 'lesser' ? 2 : 3;
        if (form.getValues('cost') !== newCost) {
            form.setValue('cost', newCost);
        }
    }
  }, [watchedTier, form, isEditing]);

  useEffect(() => {
    const fetchItemData = async () => {
      if (isCreatingNew) {
        form.reset(defaultValues);
        setItemData(null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!itemId) {
        setIsEditing(false);
        setLoading(false);
        setItemData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const itemFromDb = await getAlchemicalItemById(itemId);
        if (itemFromDb) {
          form.reset(itemFromDb);
          setItemData(itemFromDb);
        } else {
          setItemData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load item data." });
      } finally {
        setLoading(false);
      }
    };
    fetchItemData();
  }, [itemId, isCreatingNew, form, toast]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
        onEditCancel();
    } else if (itemData) {
        form.reset(itemData);
        setIsEditing(false);
    }
  };

  const onSubmit = async (data: ItemFormData) => {
    try {
      const itemToSave: NewAlchemicalItem | AlchemicalItem = {
        ...data,
        tags: data.tags || [],
      };

      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave, 'alchemicalItem');
      }

      let savedId: string;
      if (isCreatingNew) {
        savedId = await addAlchemicalItem(itemToSave as NewAlchemicalItem);
        toast({ title: "Item Created!", description: `${data.name} has been added.` });
      } else if (itemId) {
        savedId = itemId;
        await updateAlchemicalItem({ ...itemToSave, id: itemId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
      } else {
        return;
      }
      onSaveSuccess(savedId);
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDelete = async () => {
    if (!itemId) return;
    try {
      await deleteAlchemicalItem(itemId);
      toast({ title: "Item Deleted", description: "The alchemical item has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the item." });
    }
  };

  if (loading) {
    return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  }
  
  if (!itemId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center pt-6">
              <p className="text-xl text-muted-foreground">Select an item to view</p>
              <p className="text-muted-foreground">or create a new one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditing && itemData) {
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
                                <CardTitle className="text-3xl font-bold">{itemData.name}</CardTitle>
                                <div className="flex items-center gap-4 mt-2 text-sm capitalize">
                                    <button onClick={(e) => onFilterByClick({ typeFilter: itemData.type }, e)} className="hover:underline p-0 bg-transparent text-muted-foreground">{itemData.type}</button>
                                    <button onClick={(e) => onFilterByClick({ tierFilter: itemData.tier }, e)} className="hover:underline p-0 bg-transparent text-muted-foreground">{itemData.tier}</button>
                                    <span className="text-muted-foreground">Cost: {itemData.cost}</span>
                                </div>
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
                        <p className="text-foreground/80 whitespace-pre-wrap">{itemData.effect}</p>
                        
                        {itemData.tags && itemData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {itemData.tags.map(tag => (
                                      <button key={tag} onClick={(e) => onFilterByClick({ tagFilter: tag }, e)} className="bg-transparent border-none p-0 m-0">
                                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">{tag}</Badge>
                                      </button>
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
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{itemData.name}".</AlertDialogDescription></AlertDialogHeader>
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
                        <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="shrink-0 -ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                      <CardTitle>{isCreatingNew ? (isMobile ? "New Item" : "Create New Alchemical Item") : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                    </div>
                  </div>
                  {!isMobile && (
                    <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField name="type" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {ALCHEMY_ITEM_TYPES.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField name="tier" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tier</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {ALCHEMY_ITEM_TIERS.map(tier => <SelectItem key={tier} value={tier} className="capitalize">{tier}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField name="cost" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cost</FormLabel><FormControl><Input type="number" {...field} readOnly className="bg-muted" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField name="effect" control={form.control} render={({ field }) => (<FormItem><FormLabel>Effect</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
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
                                tagSource="alchemicalItem"
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
              <Button type="submit">{isCreatingNew ? "Create Item" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
