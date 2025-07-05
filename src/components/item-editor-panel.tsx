
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getItemById, addItem, updateItem, deleteItem, addTags, getAllDeeds } from "@/lib/idb";
import type { Item, NewItem, ItemType, WeaponDamageDie, WeaponType, WeaponProperty, ItemPlacement, ArmorWeight, ArmorDie, ItemMagicTier, Deed } from "@/lib/types";
import { 
    ITEM_TYPES, 
    ITEM_QUALITIES,
    ITEM_MAGIC_TIERS,
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
import { Trash2, Edit, Tag, X, ArrowLeft, Copy, Library } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Label } from "./ui/label";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  type: z.enum(ITEM_TYPES),
  price: z.coerce.number().min(0, "Price must be a non-negative number"),
  quality: z.enum(ITEM_QUALITIES),
  description: z.string().min(1, "Description is required"),
  magicTier: z.enum(ITEM_MAGIC_TIERS),
  enchantment: z.string().optional(),
  assignedDeedId: z.string().optional(),
  magicalTrait: z.string().optional(),
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
    if ((data.magicTier === 'magical' || data.magicTier === 'artifact') && !data.enchantment?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enchantment is required for magical items and artifacts.', path: ['enchantment'] });
    }
    if (data.magicTier === 'artifact' && !data.magicalTrait?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Magical Trait is required for artifacts.', path: ['magicalTrait'] });
    }
});

type ItemFormData = z.infer<typeof itemSchema>;

type WeaponSpecificData = Pick<Item, 'damageDie' | 'weaponType' | 'range' | 'property' | 'weaponEffect'>;
type ArmorSpecificData = Pick<Item, 'placement' | 'weight' | 'AR' | 'armorDie'>;
type ShieldSpecificData = Pick<Item, 'placement' | 'weight' | 'AR' | 'armorDie'>;

const SingleDeedSelectionDialog = ({ onSelectDeed, allDeeds, children }: { onSelectDeed: (deed: Deed) => void, allDeeds: Deed[], children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('');

  const filteredDeeds = useMemo(() => {
    return allDeeds.filter(deed => {
        const matchesSearch = deed.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTier = tierFilter === 'all' || deed.tier === tierFilter;
        const tagsToFilter = tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
        const matchesTags = tagsToFilter.length === 0 || 
                            (deed.tags && tagsToFilter.every(tag => deed.tags!.some(dt => dt.toLowerCase().includes(tag))));
        return matchesSearch && matchesTier && matchesTags;
    });
  }, [allDeeds, searchTerm, tierFilter, tagFilter]);

  const handleSelect = (deed: Deed) => {
    onSelectDeed(deed);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearchTerm("");
      setTierFilter("all");
      setTagFilter("");
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader><DialogTitle>Select a Deed</DialogTitle></DialogHeader>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Input 
            placeholder="Search deeds..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[150px]"
          />
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Filter tier" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
                <SelectItem value="mighty">Mighty</SelectItem>
            </SelectContent>
          </Select>
           <div className="flex-1 min-w-[150px]">
             <TagInput
              value={tagFilter ? tagFilter.split(',').map(t => t.trim()).filter(Boolean) : []}
              onChange={(tags) => setTagFilter(tags.join(','))}
              placeholder="Filter by tags..."
              tagSource="deed"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 border rounded-md p-4">
          <div className="space-y-2">
            {filteredDeeds.map(deed => (
              <div key={deed.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer" onClick={() => handleSelect(deed)}>
                <div className="flex-1">
                  <p className="font-semibold">{deed.name} <span className="text-xs text-muted-foreground">({deed.tier})</span></p>
                  <p className="text-xs text-muted-foreground truncate">{deed.effects.hit}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

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
  magicTier: 'normal',
  description: "",
  tags: [],
  property: 'one-handed',
  weaponType: 'melee',
  damageDie: 'd4',
  AR: '0',
  armorDie: 'd4',
  weight: 'None',
  placement: 'head',
};

export default function ItemEditorPanel({ itemId, isCreatingNew, template, onSaveSuccess, onDeleteSuccess, onUseAsTemplate, onEditCancel, onBack }: ItemEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!itemId);
  const [itemData, setItemData] = useState<Item | null>(null);
  const isMobile = useIsMobile();
  
  const [allDeeds, setAllDeeds] = useState<Deed[]>([]);
  const [weaponData, setWeaponData] = useState<Partial<WeaponSpecificData>>({});
  const [armorData, setArmorData] = useState<Partial<ArmorSpecificData>>({});
  const [shieldData, setShieldData] = useState<Partial<ShieldSpecificData>>({});
  
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

  const { watch, setValue, getValues } = form;
  const watchedType = watch('type');
  const watchedWeaponType = watch('weaponType');
  const watchedMagicTier = watch('magicTier');
  const previousTypeRef = useRef<ItemType | undefined>(watchedType);
  const watchedAssignedDeedId = watch('assignedDeedId');
  const [assignedDeed, setAssignedDeed] = useState<Deed | null>(null);
  
  useEffect(() => {
    getAllDeeds().then(setAllDeeds);
  }, []);
  
  useEffect(() => {
    if (watchedAssignedDeedId && allDeeds.length > 0) {
      const deed = allDeeds.find(d => d.id === watchedAssignedDeedId);
      setAssignedDeed(deed || null);
    } else {
      setAssignedDeed(null);
    }
  }, [watchedAssignedDeedId, allDeeds]);

  useEffect(() => {
    if (isEditing) {
      if (watchedMagicTier === 'magical' || watchedMagicTier === 'artifact') {
        setValue('quality', 'fine');
      }
    }
  }, [watchedMagicTier, isEditing, setValue]);

  useEffect(() => {
    const previousType = previousTypeRef.current;
    if (previousType === watchedType || !isEditing) return;

    const currentValues = getValues();
    if (previousType === 'weapon') {
      setWeaponData({
        damageDie: currentValues.damageDie,
        weaponType: currentValues.weaponType,
        range: currentValues.range,
        property: currentValues.property,
        weaponEffect: currentValues.weaponEffect,
      });
    } else if (previousType === 'armor') {
      setArmorData({
        placement: currentValues.placement,
        weight: currentValues.weight,
        AR: currentValues.AR,
        armorDie: currentValues.armorDie,
      });
    } else if (previousType === 'shield') {
      setShieldData({
        placement: currentValues.placement,
        weight: currentValues.weight,
        AR: currentValues.AR,
        armorDie: currentValues.armorDie,
      });
    }

    const allSpecificKeys: (keyof ItemFormData)[] = [
      'damageDie', 'weaponType', 'range', 'property', 'weaponEffect',
      'placement', 'weight', 'AR', 'armorDie'
    ];
    allSpecificKeys.forEach(key => setValue(key, undefined));

    if (watchedType === 'weapon') {
      Object.entries(weaponData).forEach(([key, value]) => setValue(key as keyof ItemFormData, value));
    } else if (watchedType === 'armor') {
      Object.entries(armorData).forEach(([key, value]) => setValue(key as keyof ItemFormData, value));
    } else if (watchedType === 'shield') {
      Object.entries(shieldData).forEach(([key, value]) => setValue(key as keyof ItemFormData, value));
      setValue('placement', 'shield', { shouldValidate: true });
      setValue('weight', 'None', { shouldValidate: true });
    }

    previousTypeRef.current = watchedType;
  }, [watchedType, getValues, setValue, isEditing, weaponData, armorData, shieldData]);


  useEffect(() => {
    const fetchItemData = async () => {
      if (isCreatingNew) {
        form.reset(initialFormValues);
        if (template) {
          setItemData(template as Item || null);
          setWeaponData(template);
          setArmorData(template);
          setShieldData(template);
        } else {
          setWeaponData({ property: 'one-handed', weaponType: 'melee', damageDie: 'd4' });
          setArmorData({ placement: 'head', weight: 'None', AR: '0', armorDie: 'd4' });
          setShieldData({ placement: 'shield', weight: 'None', AR: '0', armorDie: 'd4' });
        }
        previousTypeRef.current = template?.type || 'weapon';
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
          setWeaponData(itemFromDb);
          if (itemFromDb.type === 'armor') {
            setArmorData(itemFromDb);
            setShieldData({});
          } else if (itemFromDb.type === 'shield') {
            setShieldData(itemFromDb);
            setArmorData({});
          } else {
            setArmorData({});
            setShieldData({});
          }
          previousTypeRef.current = itemFromDb.type;
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
        setWeaponData(itemData);
        if (itemData.type === 'armor') {
            setArmorData(itemData);
            setShieldData({});
        } else if (itemData.type === 'shield') {
            setShieldData(itemData);
            setArmorData({});
        } else {
            setArmorData({});
            setShieldData({});
        }
        previousTypeRef.current = itemData.type;
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
      const baseData: Partial<Item> = {
        name: data.name,
        type: data.type,
        price: data.price,
        quality: data.quality,
        description: data.description,
        magicTier: data.magicTier,
        tags: data.tags || [],
      };

      switch (data.type) {
        case 'weapon':
          baseData.damageDie = data.damageDie;
          baseData.weaponType = data.weaponType;
          baseData.range = data.range;
          baseData.property = data.property;
          baseData.weaponEffect = data.weaponEffect;
          break;
        case 'armor':
        case 'shield':
          baseData.placement = data.placement;
          baseData.weight = data.weight;
          baseData.AR = data.AR;
          baseData.armorDie = data.armorDie;
          break;
        case 'tool':
          break;
      }
      
      if (data.magicTier === 'magical' || data.magicTier === 'artifact') {
          baseData.enchantment = data.enchantment;
      }
      if (data.magicTier === 'artifact') {
          baseData.assignedDeedId = data.assignedDeedId;
          baseData.magicalTrait = data.magicalTrait;
      }
      
      const itemToSave = baseData as NewItem;

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
        await updateItem({ ...itemToSave, id: itemId } as Item);
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
  
  const handleSelectDeed = (deed: Deed) => {
    setValue('assignedDeedId', deed.id, { shouldValidate: true });
  };

  const handleRemoveDeed = () => {
    setValue('assignedDeedId', undefined, { shouldValidate: true });
  };

  const renderViewDetails = () => {
    if (!itemData) return null;
    let typeSpecificDetails;

    switch(itemData.type) {
      case 'weapon':
        const typeAndRange = (itemData.weaponType === 'missile' || itemData.weaponType === 'spell') && itemData.range
            ? `${itemData.weaponType} (${itemData.range})`
            : itemData.weaponType;

        typeSpecificDetails = (
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
        break;
      case 'armor':
      case 'shield':
        typeSpecificDetails = (
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
        break;
      case 'tool':
        typeSpecificDetails = null;
        break;
      default: typeSpecificDetails = null;
    }
    
    const deed = itemData.assignedDeedId ? allDeeds.find(d => d.id === itemData.assignedDeedId) : null;

    return (
      <>
        {itemData.description && <div><h4 className="text-md font-semibold text-primary-foreground">Description</h4><p className="text-foreground/80 whitespace-pre-wrap">{itemData.description}</p></div>}
        {typeSpecificDetails && <Separator />}
        {typeSpecificDetails}
        {(itemData.magicTier === 'magical' || itemData.magicTier === 'artifact') && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-primary-foreground">{itemData.magicTier === 'magical' ? 'Magical Properties' : 'Artifact Properties'}</h4>
              {itemData.enchantment && <div><p className="font-semibold text-muted-foreground">Enchantment:</p><p className="text-foreground/80 whitespace-pre-wrap">{itemData.enchantment}</p></div>}
              {itemData.magicTier === 'artifact' && itemData.magicalTrait && <div><p className="font-semibold text-muted-foreground">Magical Trait:</p><p className="text-foreground/80 whitespace-pre-wrap">{itemData.magicalTrait}</p></div>}
              {deed && <div><p className="font-semibold text-muted-foreground">Granted Deed:</p><p className="text-accent">{deed.name}</p></div>}
            </div>
          </>
        )}
      </>
    )
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
                                    <span>{itemData.magicTier} {itemData.type}</span>
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

  const renderTypeSpecificFields = () => {
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
                  <FormField name="range" control={form.control} render={({ field }) => (<FormItem><FormLabel>Range</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} placeholder="e.g., 30" /></FormControl><FormMessage /></FormItem>)} />
                )}
                <FormField name="property" control={form.control} render={({ field }) => (<FormItem><FormLabel>Property</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{WEAPON_PROPERTIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <FormField name="weaponEffect" control={form.control} render={({ field }) => (<FormItem><FormLabel>Weapon Effect</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} rows={3} /></FormControl></FormItem>)} />
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
                <FormField name="AR" control={form.control} render={({ field }) => (<FormItem><FormLabel>AR</FormLabel><FormControl><Input {...field} value={field.value ?? ''} placeholder="e.g., +1" /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="armorDie" control={form.control} render={({ field }) => (<FormItem><FormLabel>Armor Die</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ARMOR_DIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
          </>
        );
      case 'tool':
        return null;
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
                <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} rows={4} /></FormControl><FormMessage/></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField name="type" control={form.control} render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ITEM_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField name="magicTier" control={form.control} render={({ field }) => (<FormItem><FormLabel>Tier</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ITEM_MAGIC_TIERS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField name="quality" control={form.control} render={({ field }) => (<FormItem><FormLabel>Quality</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={watchedMagicTier !== 'normal'}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ITEM_QUALITIES.map(q => <SelectItem key={q} value={q} className="capitalize">{q}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField name="price" control={form.control} render={({ field }) => (<FormItem><FormLabel>Price (gp)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />
                </div>
                
                {renderTypeSpecificFields()}

                {(watchedMagicTier === 'magical' || watchedMagicTier === 'artifact') && (
                  <>
                    <Separator />
                    <h3 className="text-lg font-semibold text-primary-foreground">Magical Properties</h3>
                    <FormField name="enchantment" control={form.control} render={({ field }) => (<FormItem><FormLabel>Enchantment</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                  </>
                )}

                {watchedMagicTier === 'artifact' && (
                  <>
                    <FormField name="magicalTrait" control={form.control} render={({ field }) => (<FormItem><FormLabel>Magical Trait</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="space-y-2">
                      <Label>Granted Deed</Label>
                      {assignedDeed ? (
                        <div className="flex items-center justify-between rounded-md border p-3">
                          <p className="font-semibold">{assignedDeed.name} <span className="text-xs text-muted-foreground">({assignedDeed.tier})</span></p>
                          <div className="flex items-center gap-2">
                            <SingleDeedSelectionDialog onSelectDeed={handleSelectDeed} allDeeds={allDeeds}>
                              <Button type="button" variant="outline" size="sm">Change</Button>
                            </SingleDeedSelectionDialog>
                            <Button type="button" variant="ghost" size="icon" onClick={handleRemoveDeed}><X className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ) : (
                        <SingleDeedSelectionDialog onSelectDeed={handleSelectDeed} allDeeds={allDeeds}>
                          <Button type="button" variant="outline" size="sm" className="w-full">
                            <Library className="h-4 w-4 mr-2" />
                            Select a Deed
                          </Button>
                        </SingleDeedSelectionDialog>
                      )}
                      <FormField name="assignedDeedId" control={form.control} render={() => <FormMessage />} />
                    </div>
                  </>
                )}

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
