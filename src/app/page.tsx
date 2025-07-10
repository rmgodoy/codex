
"use client";

import React, { useState, useEffect } from 'react';
import AppRouter from '@/components/app-router';
import MainLayout from '@/components/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { listWorlds, deleteWorld, renameWorld, exportWorldData } from '@/lib/idb';
import { Download, Edit, Trash2, Skull, BookCopy, Sword, Users, Swords as SwordsIcon, Map as MapIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { WorldMetadata } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const landingFeatures = [
    { title: "Bestiary", description: "Create, edit, and manage all the creatures for your game.", icon: Skull },
    { title: "Deeds Library", description: "A library of actions that creatures can perform.", icon: BookCopy },
    { title: "Items & Alchemy", description: "Catalog weapons, armor, potions, and other items.", icon: Sword },
    { title: "NPCs & Factions", description: "Create detailed characters and manage the factions in your world.", icon: Users },
    { title: "Encounters", description: "Design and run combat encounters.", icon: SwordsIcon },
    { title: "Maps & Dungeons", description: "Build your world on a hex grid and assemble complex dungeons.", icon: MapIcon },
];

function LandingPage() {
  const [worlds, setWorlds] = useState<WorldMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewWorldDialogOpen, setIsNewWorldDialogOpen] = useState(false);
  const [newWorldName, setNewWorldName] = useState('');
  const [editingWorld, setEditingWorld] = useState<{ oldName: string, newName: string, slug: string } | null>(null);
  const { toast } = useToast();

  const fetchWorlds = async () => {
    setLoading(true);
    try {
      const worldData = await listWorlds();
      setWorlds(worldData);
    } catch (e) {
      console.error("Failed to list worlds", e);
      toast({ variant: "destructive", title: "Error", description: "Could not load worlds list." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorlds();
  }, []);

  const handleCreateWorld = () => {
    if (!newWorldName.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'World name cannot be empty.' });
      return;
    }
    const slug = newWorldName.trim().toLowerCase().replace(/\s+/g, '-');
    if (worlds.some(w => w.slug === slug)) {
      toast({ variant: 'destructive', title: 'Name Exists', description: 'A world with this name already exists.' });
      return;
    }
    window.location.hash = `#/${slug}`;
  };
  
  const handleDeleteWorld = async (worldSlug: string) => {
    const worldToDelete = worlds.find(w => w.slug === worldSlug);
    if (!worldToDelete) return;
    await deleteWorld(worldSlug);
    toast({ title: 'World Deleted', description: `"${worldToDelete.name}" has been permanently deleted.` });
    fetchWorlds();
  };
  
  const handleRenameWorld = async () => {
    if (!editingWorld || !editingWorld.newName.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'New world name cannot be empty.' });
      return;
    }
    const { oldName, newName, slug: oldSlug } = editingWorld;
    const newSlug = newName.trim().toLowerCase().replace(/\s+/g, '-');
    if (worlds.some(w => w.slug === newSlug && w.slug !== oldSlug)) {
        toast({ variant: 'destructive', title: 'Name Exists', description: 'A world with this name already exists.' });
        return;
    }
    try {
        await renameWorld(oldSlug, newName);
        toast({ title: 'World Renamed', description: `"${oldName}" is now "${newName}".` });
        setEditingWorld(null);
        fetchWorlds();
    } catch(e) {
         toast({ variant: 'destructive', title: 'Error', description: 'Could not rename world.' });
    }
  };

  const handleExport = async (worldSlug: string) => {
     const worldToExport = worlds.find(w => w.slug === worldSlug);
     if (!worldToExport) return;
     try {
      const dataToExport = await exportWorldData(worldSlug);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `tresspasser_world_${worldToExport.name}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Export Successful", description: `"${worldToExport.name}" data has been downloaded.` });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export the data." });
    }
  }

  return (
    <MainLayout showSidebarTrigger={false}>
      <div className="h-full overflow-y-auto bg-background/50">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl">
              Tresspasser Compendium
            </h1>
            <p className="mt-3 max-w-md mx-auto text-lg text-muted-foreground sm:text-xl md:mt-5 md:max-w-3xl">
              A comprehensive application for managing and organizing your TTRPG worlds. Create creatures, design encounters, build dungeons, and bring your stories to life.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <Dialog open={isNewWorldDialogOpen} onOpenChange={setIsNewWorldDialogOpen}>
                <DialogTrigger asChild>
                   <Button size="lg">{worlds.length > 0 ? "New World" : "Get Started"}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New World</DialogTitle>
                    <DialogDescription>Give your new world a name to begin your journey.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="world-name">World Name</Label>
                    <Input 
                      id="world-name"
                      value={newWorldName}
                      onChange={(e) => setNewWorldName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorld() }}
                      placeholder="e.g., Aethelgard"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateWorld}>Create World</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mt-20">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading worlds...</p>
            ) : worlds.length > 0 ? (
                <>
                <h2 className="text-2xl font-bold text-center mb-8">Your Worlds</h2>
                <div className="max-w-3xl mx-auto space-y-4">
                    {worlds.map((world) => (
                      <div key={world.slug} className="border rounded-lg p-4 flex items-center justify-between gap-4 bg-card">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-primary-foreground">{world.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{world.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <Button asChild>
                                <a href={`#/${world.slug}`}>Enter World</a>
                           </Button>
                           <Separator orientation="vertical" className="h-6" />
                           <Button variant="ghost" size="icon" onClick={() => setEditingWorld({ oldName: world.name, newName: world.name, slug: world.slug })}><Edit/></Button>
                           <Button variant="ghost" size="icon" onClick={() => handleExport(world.slug)}><Download/></Button>
                           <AlertDialog>
                               <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2/></Button></AlertDialogTrigger>
                               <AlertDialogContent>
                               <AlertDialogHeader>
                                   <AlertDialogTitle>Delete "{world.name}"?</AlertDialogTitle>
                                   <AlertDialogDescription>This action cannot be undone. All data for this world will be permanently deleted.</AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleDeleteWorld(world.slug)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                               </AlertDialogFooter>
                               </AlertDialogContent>
                           </AlertDialog>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {landingFeatures.map((feature) => (
                        <Card key={feature.title}>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <feature.icon className="h-8 w-8 text-accent shrink-0" />
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>
       {editingWorld && (
        <Dialog open={!!editingWorld} onOpenChange={() => setEditingWorld(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename "{editingWorld.oldName}"</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="world-name-edit">New World Name</Label>
              <Input
                id="world-name-edit"
                value={editingWorld.newName}
                onChange={(e) => setEditingWorld({...editingWorld, newName: e.target.value})}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameWorld() }}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleRenameWorld}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
}

export default function LandingOrAppPage() {
  const [hash, setHash] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const hasWorldInHash = hash && hash.startsWith('#/') && hash.length > 2;

  if (hasWorldInHash) {
    return <AppRouter />;
  }

  return <LandingPage />;
}
