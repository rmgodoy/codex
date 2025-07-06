
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getNpcById, addNpc, updateNpc, deleteNpc, addTags, getAllFactions } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import type { Npc, NewNpc, Faction } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, Tag, X, ArrowLeft, Copy } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";

const npcSchema = z.object({
  name: z.string().min(1, "Name is required"),
  race: z.string().optional(),
  age: z.string().optional(),
  role: z.string().optional(),
  personality: z.string().optional(),
  motivation: z.string().optional(),
  backstory: z.string().optional(),
  appearance: z.string().optional(),
  factionIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

type NpcFormData = z.infer<typeof npcSchema>;

interface NpcEditorPanelProps {
  npcId: string | null;
  isCreatingNew: boolean;
  template: Partial<Npc> | null;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onUseAsTemplate: (npcData: Npc) => void;
  onEditCancel: () => void;
  onBack?: () => void;
  dataVersion: number;
}

const defaultValues: NpcFormData = {
  name: "",
  race: "",
  age: "",
  role: "",
  personality: "",
  motivation: "",
  backstory: "",
  appearance: "",
  factionIds: [],
  tags: [],
};

const FactionSelectionDialog = ({
  onConfirm,
  allFactions,
  initialSelectedIds,
  children
}: {
  onConfirm: (ids: string[]) => void;
  allFactions: Faction[];
  initialSelectedIds: string[];
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSelection, setCurrentSelection] = useState(new Set(initialSelectedIds));

  useEffect(() => {
    if(isOpen) {
      setCurrentSelection(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  const filteredFactions = useMemo(() => {
    return allFactions.filter(faction =>
      faction.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allFactions, searchTerm]);

  const handleConfirm = () => {
    onConfirm(Array.from(currentSelection));
    setIsOpen(false);
  };

  const handleCheckboxChange = (factionId: string) => {
    setCurrentSelection(prev => {
      const newSet = new Set(prev);
      if (newSet.has(factionId)) {
        newSet.delete(factionId);
      } else {
        newSet.add(factionId);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md h-[60vh] flex flex-col">
        <DialogHeader><DialogTitle>Select Factions</DialogTitle></DialogHeader>
        <Input
          placeholder="Search factions..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="mb-4 shrink-0"
        />
        <ScrollArea className="flex-1 border rounded-md p-2">
          {filteredFactions.map(faction => (
            <div key={faction.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
              <Checkbox
                id={`faction-dialog-${faction.id}`}
                checked={currentSelection.has(faction.id)}
                onCheckedChange={() => handleCheckboxChange(faction.id)}
              />
              <label htmlFor={`faction-dialog-${faction.id}`} className="font-normal flex-1 cursor-pointer">{faction.name}</label>
            </div>
          ))}
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function NpcEditorPanel({ npcId, isCreatingNew, template, onSaveSuccess, onDeleteSuccess, onUseAsTemplate, onEditCancel, onBack, dataVersion }: NpcEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!npcId);
  const [npcData, setNpcData] = useState<Npc | null>(null);
  const [factions, setFactions] = useState<Faction[]>([]);
  const isMobile = useIsMobile();
  
  const factionMap = useMemo(() => new Map(factions.map(f => [f.id, f.name])), [factions]);

  const form = useForm<NpcFormData>({
    resolver: zodResolver(npcSchema),
    defaultValues: template || defaultValues,
  });

  useEffect(() => {
    getAllFactions().then(setFactions);
  }, [dataVersion]);

  useEffect(() => {
    const fetchNpcData = async () => {
      if (isCreatingNew) {
        form.reset(template ? { ...template, factionIds: template.factionIds || [] } : defaultValues);
        setNpcData(template as Npc | null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!npcId) {
        setIsEditing(false);
        setLoading(false);
        setNpcData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const npcFromDb = await getNpcById(npcId);
        if (npcFromDb) {
          form.reset({ ...npcFromDb, factionIds: npcFromDb.factionIds || [] });
          setNpcData(npcFromDb);
        } else {
          setNpcData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load NPC data." });
      } finally {
        setLoading(false);
      }
    };
    fetchNpcData();
  }, [npcId, isCreatingNew, template, form, toast, dataVersion]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
      onEditCancel();
    } else if (npcData) {
      form.reset({ ...npcData, factionIds: npcData.factionIds || [] });
      setIsEditing(false);
    }
  };
  
  const handleUseAsTemplate = () => {
    if (npcData) {
      onUseAsTemplate(npcData);
    }
  };

  const onSubmit = async (data: NpcFormData) => {
    try {
      const npcToSave: NewNpc | Npc = {
        ...data,
        tags: data.tags || [],
        factionIds: data.factionIds || [],
      };

      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave, 'npc');
      }

      if (isCreatingNew) {
        const newId = await addNpc(npcToSave as NewNpc);
        toast({ title: "NPC Created!", description: `${data.name} has been added.` });
        onSaveSuccess(newId);
      } else if (npcId) {
        await updateNpc({ ...npcToSave, id: npcId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
        onSaveSuccess(npcId);
      }
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDelete = async () => {
    if (!npcId) return;
    try {
      await deleteNpc(npcId);
      toast({ title: "NPC Deleted", description: "The NPC has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the NPC." });
    }
  };

  if (loading) {
    return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  }
  
  if (!npcId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center pt-6">
              <p className="text-xl text-muted-foreground">Select an NPC to view</p>
              <p className="text-muted-foreground">or create a new one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditing && npcData) {
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
                                <CardTitle className="text-3xl font-bold">{npcData.name}</CardTitle>
                                <CardDescription className="flex flex-wrap gap-x-4">
                                    {npcData.race && <span>{npcData.race}</span>}
                                    {npcData.age && <span>{npcData.age}</span>}
                                    {npcData.role && <span>{npcData.role}</span>}
                                </CardDescription>
                            </div>
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
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {npcData.factionIds && npcData.factionIds.length > 0 && (
                            <>
                                <div>
                                <h3 className="text-lg font-semibold text-primary-foreground mb-2">Factions</h3>
                                <div className="flex flex-wrap gap-2">
                                    {npcData.factionIds.map(id => (
                                    <Badge key={id} variant="secondary">{factionMap.get(id) || 'Unknown'}</Badge>
                                    ))}
                                </div>
                                </div>
                                <Separator />
                            </>
                        )}
                        <div><h3 className="text-lg font-semibold text-primary-foreground mb-2">Appearance</h3><p className="text-foreground/80 whitespace-pre-wrap">{npcData.appearance || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-primary-foreground mb-2">Personality</h3><p className="text-foreground/80 whitespace-pre-wrap">{npcData.personality || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-primary-foreground mb-2">Motivation</h3><p className="text-foreground/80 whitespace-pre-wrap">{npcData.motivation || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-primary-foreground mb-2">Backstory</h3><p className="text-foreground/80 whitespace-pre-wrap">{npcData.backstory || "Not specified."}</p></div>
                        {npcData.tags && npcData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">
                                    {npcData.tags.map(tag => (
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
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{npcData.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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
                      <CardTitle>{isCreatingNew ? (isMobile ? "New NPC" : "Create New NPC") : `Editing: ${form.getValues("name") || "..."}`}</CardTitle>
                    </div>
                  </div>
                  {!isMobile && (
                      <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="race" control={form.control} render={({ field }) => (<FormItem><FormLabel>Race</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="age" control={form.control} render={({ field }) => (<FormItem><FormLabel>Age</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="role" control={form.control} render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField
                        control={form.control}
                        name="factionIds"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Factions</FormLabel>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 min-h-10 p-2 border rounded-md border-input">
                                {(field.value || []).map(id => {
                                    const factionName = factionMap.get(id);
                                    if (!factionName) return null;
                                    return (
                                        <Badge key={id} variant="secondary">
                                        {factionName}
                                        <button
                                            type="button"
                                            className="ml-1 rounded-full outline-none"
                                            onClick={() => field.onChange(field.value?.filter(fid => fid !== id))}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        </Badge>
                                    )
                                    })}
                                    {(!field.value || field.value.length === 0) && (
                                        <span className="text-sm text-muted-foreground self-center">No factions selected</span>
                                    )}
                                </div>
                                <FactionSelectionDialog
                                    onConfirm={field.onChange}
                                    allFactions={factions}
                                    initialSelectedIds={field.value || []}
                                >
                                    <Button type="button" variant="outline" className="w-full">
                                        Select Factions...
                                    </Button>
                                </FactionSelectionDialog>
                                </div>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <FormField name="appearance" control={form.control} render={({ field }) => (<FormItem><FormLabel>Appearance</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl></FormItem>)} />
                <FormField name="personality" control={form.control} render={({ field }) => (<FormItem><FormLabel>Personality</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>)} />
                <FormField name="motivation" control={form.control} render={({ field }) => (<FormItem><FormLabel>Motivation</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>)} />
                <FormField name="backstory" control={form.control} render={({ field }) => (<FormItem><FormLabel>Backstory</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl></FormItem>)} />
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
                                tagSource="npc"
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
              <Button type="submit">{isCreatingNew ? "Create NPC" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
