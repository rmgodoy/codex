

"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import type { PantheonEntity, NewPantheonEntity, Item, PantheonRelationship } from "@/lib/types";
import { getPantheonEntityById, addPantheonEntity, updatePantheonEntity, deletePantheonEntity, addTags, getAllPantheonEntities, getAllItems } from "@/lib/idb";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, Tag, X, ArrowLeft, Plus, Users, Library, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import Link from "next/link";
import { useWorld } from "./world-provider";

const pantheonRelationshipSchema = z.object({
  id: z.string(),
  targetEntityId: z.string().min(1, "Target Entity is required"),
  type: z.string().min(1, "Relationship type is required"),
});

const pantheonEntitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  entityType: z.string().optional(),
  domain: z.string().optional(),
  symbols: z.string().optional(),
  followers: z.string().optional(),
  artifactId: z.string().optional(),
  relationships: z.array(pantheonRelationshipSchema).optional(),
  goal: z.string().optional(),
  lore: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type PantheonFormData = z.infer<typeof pantheonEntitySchema>;

const defaultValues: PantheonFormData = {
  name: "",
  entityType: "",
  domain: "",
  symbols: "",
  followers: "",
  artifactId: "",
  relationships: [],
  goal: "",
  lore: "",
  tags: [],
};

const AddRelationshipDialog = ({ currentEntityId, allEntities, onAdd }: { currentEntityId: string | null, allEntities: PantheonEntity[], onAdd: (relationship: PantheonRelationship) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetEntityId, setTargetEntityId] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const availableEntities = useMemo(() => {
    return (allEntities || []).filter(entity => entity.id !== currentEntityId);
  }, [allEntities, currentEntityId]);

  const handleAdd = () => {
    if (targetEntityId && relationshipType) {
      onAdd({
        id: crypto.randomUUID(),
        targetEntityId: targetEntityId,
        type: relationshipType,
      });
      setIsOpen(false);
      setTargetEntityId('');
      setRelationshipType('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" /> Add Relationship</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New Relationship</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="target-entity">Target Entity</Label>
             <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="target-entity"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                    >
                        {targetEntityId ? availableEntities.find(e => e.id === targetEntityId)?.name : "Select an Entity..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <ScrollArea className="h-48">
                      {availableEntities.map(entity => (
                          <Button
                              key={entity.id}
                              variant="ghost"
                              onClick={() => {
                                  setTargetEntityId(entity.id);
                                  setIsPickerOpen(false);
                              }}
                              className={cn("w-full justify-start", targetEntityId === entity.id && "bg-accent")}
                          >
                              {entity.name}
                          </Button>
                      ))}
                    </ScrollArea>
                </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship-type">Relationship Type</Label>
            <Input
              id="relationship-type"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              placeholder="e.g., friends with, hates, sibling of..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!targetEntityId || !relationshipType}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ArtifactSelectionDialog = ({ onSelect, allArtifacts, children }: { onSelect: (id: string) => void, allArtifacts: Item[], children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArtifacts = useMemo(() => {
    return allArtifacts.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allArtifacts, searchTerm]);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md h-[60vh] flex flex-col">
        <DialogHeader><DialogTitle>Select an Artifact</DialogTitle></DialogHeader>
        <Input placeholder="Search artifacts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-4 shrink-0"/>
        <ScrollArea className="flex-1 border rounded-md p-2">
          {filteredArtifacts.map(item => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                onSelect(item.id);
                setIsOpen(false);
              }}
            >
              {item.name}
            </Button>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};


interface PantheonEditorPanelProps {
  entityId: string | null;
  isCreatingNew: boolean;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onEditCancel: () => void;
  onBack?: () => void;
  dataVersion: number;
  onFilterByClick: (updates: { tagFilter?: string }, e: React.MouseEvent) => void;
}

export default function PantheonEditorPanel({ entityId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onBack, dataVersion, onFilterByClick }: PantheonEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!entityId);
  const [entityData, setEntityData] = useState<PantheonEntity | null>(null);
  const [allEntities, setAllEntities] = useState<PantheonEntity[]>([]);
  const [allArtifacts, setAllArtifacts] = useState<Item[]>([]);
  const isMobile = useIsMobile();
  const { worldSlug } = useWorld();
  
  const entityMap = useMemo(() => new Map(allEntities.map(e => [e.id, e.name])), [allEntities]);
  const artifactMap = useMemo(() => new Map(allArtifacts.map(a => [a.id, a.name])), [allArtifacts]);

  const form = useForm<PantheonFormData>({
    resolver: zodResolver(pantheonEntitySchema),
    defaultValues,
  });

  const { control, watch, setValue } = form;

  const { fields: relationshipFields, append: appendRelationship, remove: removeRelationship } = useFieldArray({
    control: form.control,
    name: "relationships",
  });

  useEffect(() => {
    Promise.all([
      getAllPantheonEntities(),
      getAllItems().then(items => items.filter(item => item.magicTier === 'artifact'))
    ]).then(([entities, artifacts]) => {
      setAllEntities(entities);
      setAllArtifacts(artifacts);
    });
  }, [dataVersion]);

  useEffect(() => {
    const fetchEntityData = async () => {
      if (isCreatingNew) {
        form.reset(defaultValues);
        setEntityData(null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!entityId) {
        setIsEditing(false);
        setLoading(false);
        setEntityData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const entityFromDb = await getPantheonEntityById(entityId);
        if (entityFromDb) {
          form.reset({ ...defaultValues, ...entityFromDb });
          setEntityData(entityFromDb);
        } else {
          setEntityData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load entity data." });
      } finally {
        setLoading(false);
      }
    };
    fetchEntityData();
  }, [entityId, isCreatingNew, form, toast, dataVersion]);
  
  const handleCancel = () => {
    if (isCreatingNew) {
        onEditCancel();
    } else if (entityData) {
        form.reset({ ...defaultValues, ...entityData });
        setIsEditing(false);
    }
  };

  const onSubmit = async (data: PantheonFormData) => {
    try {
      const entityToSave: NewPantheonEntity | PantheonEntity = {
        ...data,
        tags: data.tags || [],
        relationships: data.relationships || [],
      };

      const tagsToSave = data.tags || [];
      if (tagsToSave.length > 0) {
        await addTags(tagsToSave, 'pantheon');
      }

      if (isCreatingNew) {
        const newId = await addPantheonEntity(entityToSave as NewPantheonEntity);
        toast({ title: "Entity Created!", description: `${data.name} has been added.` });
        onSaveSuccess(newId);
      } else if (entityId) {
        await updatePantheonEntity({ ...entityToSave, id: entityId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
        onSaveSuccess(entityId);
      }
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };

  const handleDelete = async () => {
    if (!entityId) return;
    try {
      await deletePantheonEntity(entityId);
      toast({ title: "Entity Deleted", description: "The entity has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the entity." });
    }
  };
  
  const watchedArtifactId = watch('artifactId');

  if (loading) return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  if (!entityId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]"><CardContent className="text-center pt-6"><p className="text-xl text-muted-foreground">Select an entity to view</p><p className="text-muted-foreground">or create a new one.</p></CardContent></Card>
      </div>
    );
  }

  if (!isEditing && entityData) {
    const fullTitle = `${entityData.name}, The ${entityData.entityType || '...'} of ${entityData.domain || '...'}`;
    return (
        <div className="w-full max-w-5xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex flex-row items-start justify-between">
                        <div className="flex items-center gap-2">
                             {isMobile && onBack && <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 -ml-2 -mt-1"><ArrowLeft className="h-5 w-5" /></Button>}
                            <div>
                                <CardTitle className="text-3xl font-bold">{fullTitle}</CardTitle>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4"/><span className="hidden sm:inline ml-2">Edit</span></Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">Lore</h3><p className="text-foreground/80 whitespace-pre-wrap">{entityData.lore || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">Goal</h3><p className="text-foreground/80 whitespace-pre-wrap">{entityData.goal || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">Symbols</h3><p className="text-foreground/80 whitespace-pre-wrap">{entityData.symbols || "Not specified."}</p></div>
                        <Separator />
                        <div><h3 className="text-lg font-semibold text-foreground mb-2">Followers</h3><p className="text-foreground/80 whitespace-pre-wrap">{entityData.followers || "Not specified."}</p></div>
                        
                        {entityData.artifactId && (
                          <><Separator /><p><span className="font-semibold text-muted-foreground">Artifact:</span> <a href={`#/${worldSlug}/items/${entityData.artifactId}`} className="text-accent hover:underline">{artifactMap.get(entityData.artifactId) || 'Unknown Artifact'}</a></p></>
                        )}
                        
                        {entityData.relationships && entityData.relationships.length > 0 && (
                             <><Separator /><div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">Relationships</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {entityData.relationships.map(rel => (
                                        <li key={rel.id} className="text-sm">
                                            <span className="capitalize">{rel.type}</span> <span className="font-semibold text-accent">{entityMap.get(rel.targetEntityId) || 'Unknown Entity'}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div></>
                        )}
                        {entityData.tags && entityData.tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex flex-wrap gap-2">{entityData.tags.map(tag => <button key={tag} onClick={(e) => onFilterByClick({ tagFilter: tag }, e)} className="bg-transparent border-none p-0 m-0"><Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">{tag}</Badge></button>)}</div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter><AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{entityData.name}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardFooter>
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
                    {isMobile && onBack && <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="shrink-0 -ml-2"><ArrowLeft className="h-5 w-5" /></Button>}
                    <div><CardTitle>{isCreatingNew ? "Create New Entity" : `Editing: ${form.getValues("name") || "..."}`}</CardTitle></div>
                  </div>
                  {!isMobile && <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField name="name" control={control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name="entityType" control={control} render={({ field }) => (<FormItem><FormLabel>Entity Type</FormLabel><FormControl><Input {...field} placeholder="e.g., God, Titan..." /></FormControl></FormItem>)} />
                  <FormField name="domain" control={control} render={({ field }) => (<FormItem><FormLabel>Domain</FormLabel><FormControl><Input {...field} placeholder="e.g., War, Oceans..." /></FormControl></FormItem>)} />
                </div>
                <FormField name="symbols" control={control} render={({ field }) => (<FormItem><FormLabel>Symbols</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField name="followers" control={control} render={({ field }) => (<FormItem><FormLabel>Followers</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField name="goal" control={control} render={({ field }) => (<FormItem><FormLabel>Goal</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl></FormItem>)} />
                <FormField name="lore" control={control} render={({ field }) => (<FormItem><FormLabel>Lore</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl></FormItem>)} />
                <FormField name="tags" control={control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />Tags</FormLabel><FormControl><TagInput value={field.value || []} onChange={field.onChange} placeholder="Add tags..." tagSource="pantheon" /></FormControl><FormMessage /></FormItem>)} />
                <Separator/>
                <div className="space-y-2">
                    <Label>Artifact</Label>
                    <div className="flex items-center gap-2">
                        {watchedArtifactId ? (
                            <div className="flex-1 flex items-center justify-between rounded-md border p-2">
                                <p className="font-semibold">{artifactMap.get(watchedArtifactId)}</p>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setValue('artifactId', undefined)}><X className="h-4 w-4"/></Button>
                            </div>
                        ) : (
                            <ArtifactSelectionDialog onSelect={(id) => setValue('artifactId', id)} allArtifacts={allArtifacts}>
                                <Button type="button" variant="outline" className="w-full"><Library className="h-4 w-4 mr-2"/>Select Artifact</Button>
                            </ArtifactSelectionDialog>
                        )}
                    </div>
                </div>
                <Separator/>
                <div>
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-foreground">Relationships</h3><AddRelationshipDialog currentEntityId={entityId} allEntities={allEntities} onAdd={appendRelationship} /></div>
                    <div className="space-y-2">
                        {relationshipFields.map((field, index) => (<div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card-foreground/5"><p className="flex-1"><span className="capitalize">{field.type}</span> <span className="font-semibold text-accent">{entityMap.get(field.targetEntityId) || '...'}</span></p><Button type="button" variant="ghost" size="icon" onClick={() => removeRelationship(index)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button></div>))}
                        {relationshipFields.length === 0 && <p className="text-muted-foreground text-center text-sm py-2">No relationships defined.</p>}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex items-center gap-2">
              {!isCreatingNew && <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{form.getValues("name")}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
              <div className="flex-grow" />
              {!isMobile && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
              <Button type="submit">{isCreatingNew ? "Create Entity" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
