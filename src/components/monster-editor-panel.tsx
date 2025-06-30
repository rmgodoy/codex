
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getCreatureById, addCreature, updateCreature, deleteCreature, addDeed, getDeedsByIds, getAllDeeds } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { Creature, Deed, DeedData, CreatureWithDeeds } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tag, Trash2, Heart, Rabbit, Zap, Crosshair, Shield, ShieldHalf, Dice5, Edit, ChevronsUpDown, Copy, X, Library } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { DeedDisplay } from "./deed-display";


const deedEffectsSchema = z.object({
  start: z.string().optional(),
  base: z.string().optional(),
  hit: z.string().min(1, "Hit effect is required"),
  shadow: z.string().min(1, "Shadow effect is required"),
  end: z.string().optional(),
});

const deedSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Deed name is required"),
  tier: z.enum(['light', 'heavy', 'mighty']),
  type: z.enum(['attack', 'support']),
  range: z.string().min(1, "Range is required"),
  target: z.string().min(1, "Target is required"),
  effects: deedEffectsSchema,
  tags: z.string().optional(),
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
  template: Partial<CreatureWithDeeds> | null;
  onCreatureSaveSuccess: (id: string) => void;
  onCreatureDeleteSuccess: () => void;
  onUseAsTemplate: (creatureData: CreatureWithDeeds) => void;
  onEditCancel: () => void;
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

const DeedSelectionDialog = ({ onAddDeeds, allDeeds }: { onAddDeeds: (deeds: Deed[]) => void, allDeeds: Deed[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDeedIds, setSelectedDeedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>('all');

  const filteredDeeds = useMemo(() => {
    return allDeeds.filter(deed => {
        const matchesSearch = deed.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTier = tierFilter === 'all' || deed.tier === tierFilter;
        return matchesSearch && matchesTier;
    });
  }, [allDeeds, searchTerm, tierFilter]);


  const handleAddClick = () => {
    const deedsToAdd = allDeeds.filter(d => selectedDeedIds.has(d.id));
    onAddDeeds(deedsToAdd);
    setIsOpen(false);
    setSelectedDeedIds(new Set());
    setSearchTerm("");
    setTierFilter("all");
  }

  const handleCheckboxChange = (deedId: string) => {
    setSelectedDeedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deedId)) {
        newSet.delete(deedId);
      } else {
        newSet.add(deedId);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline"><Library className="h-4 w-4 mr-2" /> Add From Library</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Deeds from Library</DialogTitle>
          <DialogDescription>Select one or more deeds to add to the creature.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="Search deeds..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Filter tier" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
                <SelectItem value="mighty">Mighty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="flex-1 border rounded-md p-4">
          <div className="space-y-2">
            {filteredDeeds.map(deed => (
              <div key={deed.id} className="flex items-center gap-3">
                <Checkbox 
                  id={`deed-${deed.id}`} 
                  onCheckedChange={() => handleCheckboxChange(deed.id)}
                  checked={selectedDeedIds.has(deed.id)}
                />
                <label htmlFor={`deed-${deed.id}`} className="flex-1">
                  <p className="font-semibold">{deed.name} <span className="text-xs text-muted-foreground">({deed.tier})</span></p>
                  <p className="text-xs text-muted-foreground truncate">{deed.effects.hit}</p>
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleAddClick} disabled={selectedDeedIds.size === 0}>Add Selected</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default function CreatureEditorPanel({ creatureId, isCreatingNew, template, onCreatureSaveSuccess, onCreatureDeleteSuccess, onUseAsTemplate, onEditCancel }: CreatureEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!creatureId);
  const [creatureData, setCreatureData] = useState<CreatureWithDeeds | null>(null);
  const [allDeeds, setAllDeeds] = useState<Deed[]>([]);
  
  const form = useForm<CreatureFormData>({
    resolver: zodResolver(creatureSchema),
    defaultValues: template || defaultValues,
  });
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "deeds",
  });

  const watchedData = form.watch();

  useEffect(() => {
    getAllDeeds().then(setAllDeeds).catch(e => console.error("Could not fetch all deeds", e));
  }, []);

  useEffect(() => {
    const fetchCreatureData = async () => {
      if (isCreatingNew) {
        form.reset(template || defaultValues);
        setCreatureData(template ? (template as CreatureWithDeeds) : null);
        setIsEditing(true);
        setLoading(false);
        return;
      }

      if (!creatureId) {
        setIsEditing(false);
        setLoading(false);
        setCreatureData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const creatureFromDb = await getCreatureById(creatureId);
        if (creatureFromDb) {
          const deedObjects = await getDeedsByIds(creatureFromDb.deeds);
          const fullCreatureData: CreatureWithDeeds = {
            ...creatureFromDb,
            deeds: deedObjects
          };
          setCreatureData(fullCreatureData);
          const formData = {
            ...fullCreatureData,
            deeds: deedObjects,
            tags: Array.isArray(fullCreatureData.tags) ? fullCreatureData.tags.join(', ') : '',
          };
          form.reset(formData);
        }
      } catch (error) {
        console.error("Failed to fetch creature data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load creature data." });
      } finally {
        setLoading(false);
      }
    };
    fetchCreatureData();
  }, [creatureId, isCreatingNew, template, form, toast]);


  const onSubmit = async (data: CreatureFormData) => {
    try {
      const deedPromises = data.deeds.map(deed => {
        if (!deed.id) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...deedData } = deed;
          return addDeed(deedData as DeedData);
        }
        return Promise.resolve(deed.id);
      });

      const deedIds = await Promise.all(deedPromises);
      
      const tagsValue = data.tags || '';
      const creatureToSave: Omit<Creature, 'id'> | Creature = {
        ...data,
        tags: Array.isArray(tagsValue) ? tagsValue : tagsValue.split(',').map(t => t.trim()).filter(Boolean),
        deeds: deedIds,
      };

      if (isCreatingNew) {
        const newId = await addCreature(creatureToSave as Omit<Creature, 'id'>);
        toast({ title: "Creature Created!", description: `${data.name} has been added to the bestiary.` });
        onCreatureSaveSuccess(newId);
      } else if(creatureId) {
        await updateCreature({ ...creatureToSave, id: creatureId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
        onCreatureSaveSuccess(creatureId);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save creature:", error);
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDeleteCreature = async () => {
    if (!creatureId) return;
    try {
      await deleteCreature(creatureId);
      toast({ title: "Creature Deleted", description: "The creature has been removed from the bestiary." });
      onCreatureDeleteSuccess();
    } catch (error) {
      console.error("Failed to delete creature:", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the creature." });
    }
  };

  const handleCancel = () => {
    if (isCreatingNew) {
      onEditCancel();
    } else {
      if (creatureData) {
        const formData = {
          ...creatureData,
          tags: Array.isArray(creatureData.tags) ? creatureData.tags.join(', ') : '',
        };
        form.reset(formData);
      }
      setIsEditing(false);
    }
  }

  const handleUseAsTemplate = () => {
      if (creatureData) {
        onUseAsTemplate(creatureData);
      }
  };

  const handleAddDeedsFromLibrary = (newDeeds: Deed[]) => {
    const currentDeedIds = new Set(fields.map(f => f.id));
    const deedsToAdd = newDeeds.filter(d => !currentDeedIds.has(d.id!));
    append(deedsToAdd.map(d => ({...d, tags: Array.isArray(d.tags) ? d.tags.join(', ') : ''})));
  };
  
  const tierOrder: Record<Deed['tier'], number> = { light: 0, heavy: 1, mighty: 2 };

  if (loading && !isCreatingNew) {
     return (
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-24" />
        </CardHeader>
        <CardContent>
            <Separator className="my-6"/>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
            <Separator className="my-6"/>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </CardContent>
       </Card>
     );
  }

  if (!isCreatingNew && !creatureId && !loading) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[300px]">
        <CardContent className="text-center pt-6">
            <p className="text-xl text-muted-foreground">Select a creature to view</p>
            <p className="text-muted-foreground">or create a new one.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!isEditing && creatureId && creatureData) {
    const sortedDeeds = [...creatureData.deeds].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-3xl font-bold">{creatureData.name}</CardTitle>
                    <CardDescription className="mt-1">
                        TR {creatureData.TR}
                        {creatureData.tags && creatureData.tags.length > 0 && ` • ${creatureData.tags.join(', ')}`}
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleUseAsTemplate}><Copy className="h-4 w-4 mr-1"/> Template</Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-1"/> Edit</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Separator className="my-6"/>
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary-foreground">Attributes</h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-4">
                    <div className="flex items-center gap-2"><Heart className="h-5 w-5 text-accent"/><div><Label>HP</Label><p className="text-lg font-bold">{creatureData.attributes.HP}</p></div></div>
                    <div className="flex items-center gap-2"><Rabbit className="h-5 w-5 text-accent"/><div><Label>Speed</Label><p className="text-lg font-bold">{creatureData.attributes.Speed}</p></div></div>
                    <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-accent"/><div><Label>Initiative</Label><p className="text-lg font-bold">{creatureData.attributes.Initiative}</p></div></div>
                    <div className="flex items-center gap-2"><Crosshair className="h-5 w-5 text-accent"/><div><Label>Accuracy</Label><p className="text-lg font-bold">{creatureData.attributes.Accuracy}</p></div></div>
                    <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-accent"/><div><Label>Guard</Label><p className="text-lg font-bold">{creatureData.attributes.Guard}</p></div></div>
                    <div className="flex items-center gap-2"><ShieldHalf className="h-5 w-5 text-accent"/><div><Label>Resist</Label><p className="text-lg font-bold">{creatureData.attributes.Resist}</p></div></div>
                    <div className="flex items-center gap-2"><Dice5 className="h-5 w-5 text-accent"/><div><Label>Roll Bonus</Label><p className="text-lg font-bold">{creatureData.attributes.rollBonus}</p></div></div>
                  </div>
                </div>
                <Separator className="my-6"/>
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-primary-foreground">Deeds</h3>
                    {sortedDeeds.length > 0 ? (
                        sortedDeeds.map((deed, i) => <DeedDisplay key={i} deed={deed} />)
                    ) : (
                        <p className="text-muted-foreground">No deeds defined.</p>
                    )}
                </div>
                {(creatureData.abilities || creatureData.description) && <Separator className="my-6"/>}
                {creatureData.abilities && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-primary-foreground">Abilities</h3>
                        <p className="text-foreground/90 whitespace-pre-wrap">{creatureData.abilities}</p>
                    </div>
                )}
                {creatureData.description && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2 text-primary-foreground">Description</h3>
                        <p className="text-foreground/90 whitespace-pre-wrap">{creatureData.description}</p>
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
                      <AlertDialogAction onClick={handleDeleteCreature} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle>{isCreatingNew ? "Create a New Creature" : `Editing: ${creatureData?.name || "..."}`}</CardTitle>
              <CardDescription>
                {isCreatingNew ? "Fill out the details for your new creature." : "Make your changes and click Save."}
              </CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-8 pt-0">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <div className="flex gap-2">
                  <DeedSelectionDialog onAddDeeds={handleAddDeedsFromLibrary} allDeeds={allDeeds} />
                  <Button type="button" size="sm" variant="outline" onClick={() => append({ name: '', tier: 'light', type: 'attack', range: '', target: '', effects: { start: '', base: '', hit: '', shadow: '', end: '' } })}>
                    <Plus className="h-4 w-4 mr-2" /> Create New
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                    <Collapsible key={field.id} defaultOpen={!form.getValues(`deeds.${index}.name`)} className="border bg-card-foreground/5 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <CollapsibleTrigger asChild>
                                <button type="button" className="flex items-center gap-3 text-left w-full">
                                    <ChevronsUpDown className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-lg font-semibold text-primary-foreground">
                                        {watchedData.deeds?.[index]?.name || "New Deed"}
                                    </span>
                                    {watchedData.deeds?.[index]?.id && <span className="text-xs text-muted-foreground">(from library)</span>}
                                </button>
                            </CollapsibleTrigger>
                             <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <CollapsibleContent className="mt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField name={`deeds.${index}.name`} control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deed Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Inferno" {...field} disabled={!!watchedData.deeds?.[index]?.id} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name={`deeds.${index}.tier`} control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tier</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!watchedData.deeds?.[index]?.id}>
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!watchedData.deeds?.[index]?.id}>
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
                                        <FormControl><Input placeholder="e.g., Spell Attack vs. Resist" {...field} disabled={!!watchedData.deeds?.[index]?.id} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name={`deeds.${index}.range`} control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Range</FormLabel>
                                        <FormControl><Input placeholder="e.g., Blast 4" {...field} disabled={!!watchedData.deeds?.[index]?.id} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="mt-4 space-y-4">
                            <h4 className="font-semibold text-sm text-primary-foreground">Effects</h4>
                            <FormField name={`deeds.${index}.effects.start`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                                    <FormControl><Textarea placeholder="Effect when a creature starts its turn in an area..." {...field} rows={2} disabled={!!watchedData.deeds?.[index]?.id} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField name={`deeds.${index}.effects.base`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Base <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                                    <FormControl><Textarea placeholder="Base effect of the deed..." {...field} rows={2} disabled={!!watchedData.deeds?.[index]?.id} /></FormControl>
                                </FormItem>
                            )} />
                                <FormField name={`deeds.${index}.effects.hit`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hit <span className="text-destructive">*</span></FormLabel>
                                    <FormControl><Textarea placeholder="The primary effect on a successful hit..." {...field} rows={3} disabled={!!watchedData.deeds?.[index]?.id} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )} />
                                <FormField name={`deeds.${index}.effects.shadow`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Shadow (Critical) <span className="text-destructive">*</span></FormLabel>
                                    <FormControl><Textarea placeholder="The enhanced effect on a critical success..." {...field} rows={3} disabled={!!watchedData.deeds?.[index]?.id} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )} />
                                <FormField name={`deeds.${index}.effects.end`} control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                                    <FormControl><Textarea placeholder="Effect at the end of a creature's turn..." {...field} rows={2} disabled={!!watchedData.deeds?.[index]?.id} /></FormControl>
                                </FormItem>
                                )} />
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
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
                    <AlertDialogAction onClick={handleDeleteCreature} className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <div className="flex-grow" />
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit">{isCreatingNew ? "Create Creature" : "Save Changes"}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
