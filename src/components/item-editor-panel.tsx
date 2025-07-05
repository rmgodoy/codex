
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getItemById, addItem, updateItem, deleteItem, addTags } from "@/lib/idb";
import type { Item, NewItem } from "@/lib/types";
import { 
    ITEM_TYPES, 
    ITEM_QUALITIES, 
    WEAPON_TYPES,
    WEAPON_DAMAGE_DIES, 
    WEAPON_PROPERTIES, 
    ITEM_PLACEMENTS, 
    ARMOR_WEIGHTS, 
    ARMOR_DIES, 
    ARMOR_PLACEMENTS
} from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Tag, X, ArrowLeft, Copy } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  type: z.enum(ITEM_TYPES),
  price: z.coerce.number().min(0, "Price must be a non-negative number"),
  quality: z.enum(ITEM_QUALITIES),
  tags: z.array(z.string()).optional(),
  
  damageDie: z.enum(WEAPON_DAMAGE_DIES).optional(),
  weaponType: z.enum(WEAPON_TYPES).optional(),
  range: z.coerce.number().optional(),
  property: z.enum(WEAPON_PROPERTIES).optional(),
  weaponEffect: z.string().optional(),
  
  placement: z.enum(ITEM_PLACEMENTS).optional(),
  weight: z.enum(ARMOR_WEIGHTS).optional(),
  AR: z.string().optional(),
  armorDie: z.enum(ARMOR_DIES).optional(),
  description: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.type === 'weapon') {
        if (!data.damageDie) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Damage Die is required for weapons.', path: ['damageDie'] });
        if (!data.weaponType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Weapon Type is required for weapons.', path: ['weaponType'] });
        if ((data.weaponType === 'missile' || data.weaponType === 'spell') && (data.range === undefined || data.range < 1)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Range is required for this weapon type.', path: ['range'] });
        }
        if (!data.property) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Property is required for weapons.', path: ['property'] });
    }
    if (data.type === 'armor' || data.type === 'shield') {
        if (!data.placement) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Placement is required.', path: ['placement'] });
        if (!data.AR?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'AR is required.', path: ['AR'] });
        if (!data.armorDie) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Armor Die is required.', path: ['armorDie'] });
    }
    if (data.type === 'armor' && data.placement === 'shield') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Shield placement is for shields only.', path: ['placement']});
    }
    if (data.type === 'shield' && data.placement !== 'shield') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Shields must have shield placement.', path: ['placement'] });
    }
    if (data.type === 'tool') {
        if (!data.description?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Description is required for tools.', path: ['description'] });
    }
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemEditorPanelProps {
  itemId: string | null;
  isCreatingNew: boolean;
  template: Partial<Item> | null;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onUseAsTemplate: (itemData: Item) => void;
  onEditCancel: () => void;
  onBack?: () => void;
}

const defaultValues: ItemFormData = {
  name: "",
  type: 'weapon',
  price: 0,
  quality: 'normal',
  tags: [],
  property: 'one-handed',
  weaponType: 'melee',
};

export default function ItemEditorPanel({ itemId, isCreatingNew, template, onSaveSuccess, onDeleteSuccess, onUseAsTemplate, onEditCancel, onBack }: ItemEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!itemId);
  const [itemData, setItemData] = useState<Item | null>(null);
  const isMobile = useIsMobile();
  
  const initialFormValues = useMemo(() => {
    if (isCreatingNew) {
      return template ? { ...defaultValues, ...template } : defaultValues;
    }
    return defaultValues;
  }, [isCreatingNew, template]);

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: initialFormValues,
  });

  const { watch, setValue } = form;
  const watchedType = watch('type');
  const watchedWeaponType = watch('weaponType');

  useEffect(() => {
    if (isEditing) {
      if (watchedType === 'shield') {
          setValue('placement', 'shield', { shouldValidate: true });
          setValue('weight', 'None', { shouldValidate: true });
      }
      if (watchedType === 'armor' && form.getValues('placement') === 'shield') {
          setValue('placement', undefined, { shouldValidate: true });
      }
    }
  }, [watchedType, form, setValue, isEditing]);

  useEffect(() => {
    const fetchItemData = async () => {
      if (isCreatingNew) {
        form.reset(initialFormValues);
        setItemData(template as Item || null);
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
        const itemFromDb = await getItemById(itemId);
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
  }, [itemId, isCreatingNew, form, toast, initialFormValues, template]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
        onEditCancel();
    } else if (itemData) {
        form.reset(itemData);
        setIsEditing(false);
    }
  };

  const handleUseAsTemplate = () => {
    if (itemData) {
      onUseAsTemplate(itemData);
    }
  };

  const onSubmit = async (data: ItemFormData) => {
    try {
      const itemToSave: NewItem | Item = { ...data, tags: data.tags || [] };
      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave, 'item');
      }

      let savedId: string;
      if (isCreatingNew) {
        savedId = await addItem(itemToSave as NewItem);
        toast({ title: "Item Created!", description: `${data.name} has been added.` });
      } else if (itemId) {
        savedId = itemId;
        await updateItem({ ...itemToSave, id: itemId });
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
      await deleteItem(itemId);
      toast({ title: "Item Deleted", description: "The item has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the item." });
    }
  };
  
  if (loading) return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  if (!itemId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]"><CardContent className="text-center pt-6"><p className="text-xl text-muted-foreground">Select an item to view or create a new one.</p></CardContent>
        </Card>
      </div>
    );
  }

  const renderViewDetails = () => {
    if (!itemData) return null;
    switch(itemData.type) {
      case 'weapon':
        const typeAndRange = (itemData.weaponType === 'missile' || itemData.weaponType === 'spell') && itemData.range
            ? `${itemData.weaponType} (${itemData.range})`
            : itemData.weaponType;

        return (
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-primary-foreground">Weapon Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span className="font-semibold text-muted-foreground">Damage:</span> {itemData.damageDie}</div>
                <div className="capitalize"><span className="font-semibold text-muted-foreground">Type:</span> {typeAndRange}</div>
                <div className="capitalize"><span className="font-semibold text-muted-foreground">Property:</span> {itemData.property}</div>
            </div>
            {itemData.weaponEffect && <div><p className="font-semibold text-muted-foreground">Effect:</p><p className="text-foreground/80 whitespace-pre-wrap">{itemData.weaponEffect}</p></div>}
          </div>
        );
      case 'armor':
      case 'shield':
        return (
           <div className="space-y-4">
            <h4 className="text-md font-semibold text-primary-foreground">Armor/Shield Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span className="font-semibold text-muted-foreground">Placement:</span> {itemData.placement}</div>
                <div><span className="font-semibold text-muted-foreground">Weight:</span> {itemData.weight}</div>
                <div><span className="font-semibold text-muted-foreground">AR:</span> {itemData.AR}</div>
                <div><span className="font-semibold text-muted-foreground">Armor Die:</span> {itemData.armorDie}</div>
            </div>
          </div>
        );
      case 'tool':
        return (
           <div className="space-y-2">
            <h4 className="text-md font-semibold text-primary-foreground">Tool Details</h4>
            <p className="text-foreground/80 whitespace-pre-wrap">{itemData.description}</p>
          </div>
        );
      default: return null;
    }
  }

  if (!isEditing && itemData) {
    return (
        <div className="w-full max-w-5xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex flex-row items-start justify-between">
                        <div className="flex items-center gap-2">
                             {isMobile && onBack && <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 -ml-2 -mt-1"><ArrowLeft className="h-5 w-5" /></Button>}
                            <div>
                                <CardTitle className="text-3xl font-bold">{itemData.name}</CardTitle>
                                <CardDescription className="capitalize flex flex-wrap gap-x-4">
                                    <span>{itemData.type}</span>
                                    <span>Quality: {itemData.quality}</span>
                                    <span>Price: {itemData.price}gp</span>
                                </CardDescription>
                            </div>
                        </div>
                         <div className="flex gap-2">
                           <Button variant="outline" size="sm" onClick={handleUseAsTemplate}>
                                <Copy className="h-4 w-4"/>
                                <span className="hidden sm:inline">Template</span>
                            </Button>
                           <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4"/><span className="hidden sm:inline ml-2">Edit</span></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {renderViewDetails()}
                        {itemData.tags && itemData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50"><div className="flex flex-wrap gap-2">{itemData.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div></div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                     <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{itemData.name}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                </CardFooter>
            </Card>
        </div>
    );
  }

  const renderFormFields = () => {
    switch (watchedType) {
      case 'weapon':
        return (
          <>
            <Separator />
            <h3 className="text-lg font-semibold text-primary-foreground">Weapon Properties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <FormField name="damageDie" control={form.control} render={({ field }) => (<FormItem><FormLabel>Damage Die</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{WEAPON_DAMAGE_DIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField name="weaponType" control={form.control} render={({ field }) => (<FormItem><FormLabel>Weapon Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{WEAPON_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                {(watchedWeaponType === 'missile' || watchedWeaponType === 'spell') && (
                  <FormField name="range" control={form.control} render={({ field }) => {
                    const { value, ...rest } = field;
                    return (<FormItem><FormLabel>Range</FormLabel><FormControl><Input type="number" {...rest} value={value ?? ''} placeholder="e.g., 30" /></FormControl><FormMessage /></FormItem>)
                  }} />
                )}
                <FormField name="property" control={form.control} render={({ field }) => (<FormItem><FormLabel>Property</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{WEAPON_PROPERTIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <FormField name="weaponEffect" control={form.control} render={({ field }) => {
              const { value, ...rest } = field;
              return (<FormItem><FormLabel>Weapon Effect</FormLabel><FormControl><Textarea {...rest} value={value ?? ''} rows={3} /></FormControl></FormItem>)
            }} />
          </>
        );
      case 'armor':
      case 'shield':
        return (
          <>
            <Separator />
            <h3 className="text-lg font-semibold text-primary-foreground">Armor/Shield Properties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField name="placement" control={form.control} render={({ field }) => (<FormItem><FormLabel>Placement</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={watchedType === 'shield'}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{(watchedType === 'shield' ? [ 'shield' ] : ARMOR_PLACEMENTS).map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField name="weight" control={form.control} render={({ field }) => (<FormItem><FormLabel>Weight</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={watchedType === 'shield'}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ARMOR_WEIGHTS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField name="AR" control={form.control} render={({ field }) => {
                  const { value, ...rest } = field;
                  return (<FormItem><FormLabel>AR</FormLabel><FormControl><Input {...rest} value={value ?? ''} placeholder="+1" /></FormControl><FormMessage /></FormItem>)
                }} />
                <FormField name="armorDie" control={form.control} render={({ field }) => (<FormItem><FormLabel>Armor Die</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ARMOR_DIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
          </>
        );
      case 'tool':
        return (
           <>
            <Separator />
            <h3 className="text-lg font-semibold text-primary-foreground">Tool Properties</h3>
            <FormField name="description" control={form.control} render={({ field }) => {
              const { value, ...rest } = field;
              return (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...rest} value={value ?? ''} rows={4} /></FormControl><FormMessage/></FormItem>)
            }} />
           </>
        );
      default:
        return null;
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardHeader>
              <div className="flex flex-row justify-between items-start">
                  <div className="flex items-center gap-2">
                    {isMobile && onBack && <Button type="button" variant="ghost" size="icon" onClick={onEditCancel} className="shrink-0 -ml-2"><ArrowLeft className="h-5 w-5" /></Button>}
                    <CardTitle>{isCreatingNew ? "Create New Item" : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                  </div>
                  {!isMobile && <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <h3 className="text-lg font-semibold text-primary-foreground">Base Properties</h3>
                <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Item Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField name="type" control={form.control} render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ITEM_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField name="quality" control={form.control} render={({ field }) => (<FormItem><FormLabel>Quality</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ITEM_QUALITIES.map(q => <SelectItem key={q} value={q} className="capitalize">{q}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField name="price" control={form.control} render={({ field }) => (<FormItem><FormLabel>Price (gp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                {renderFormFields()}
                <Separator/>
                <FormField name="tags" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />Tags</FormLabel><FormControl><TagInput value={field.value || []} onChange={field.onChange} placeholder="Add tags..." tagSource="item" /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
            <CardFooter className="flex items-center gap-2">
              {!isCreatingNew && <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{form.getValues("name")}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
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
