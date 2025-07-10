
"use client";

import React, { useState, useEffect } from 'react';
import AppRouter from '@/components/app-router';
import MainLayout from '@/components/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { listWorlds, deleteWorld, renameWorld, exportWorldData } from '@/lib/idb';
import { Download, Edit, Trash2 } from 'lucide-react';

function LandingPage() {
  const [worlds, setWorlds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewWorldDialogOpen, setIsNewWorldDialogOpen] = useState(false);
  const [newWorldName, setNewWorldName] = useState('');
  const [editingWorld, setEditingWorld] = useState<{ oldName: string, newName: string } | null>(null);
  const { toast } = useToast();

  const fetchWorlds = async () => {
    setLoading(true);
    try {
      const worldNames = await listWorlds();
      setWorlds(worldNames);
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
    if (worlds.some(w => w.toLowerCase().replace(/\s+/g, '-') === slug)) {
      toast({ variant: 'destructive', title: 'Name Exists', description: 'A world with this name already exists.' });
      return;
    }
    window.location.hash = `#/${slug}`;
  };
  
  const handleDeleteWorld = async (worldName: string) => {
    await deleteWorld(worldName);
    toast({ title: 'World Deleted', description: `"${worldName}" has been permanently deleted.` });
    fetchWorlds();
  };
  
  const handleRenameWorld = async () => {
    if (!editingWorld || !editingWorld.newName.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'New world name cannot be empty.' });
      return;
    }
    const { oldName, newName } = editingWorld;
    const slug = newName.trim().toLowerCase().replace(/\s+/g, '-');
    if (worlds.some(w => w.toLowerCase().replace(/\s+/g, '-') === slug)) {
        toast({ variant: 'destructive', title: 'Name Exists', description: 'A world with this name already exists.' });
        return;
    }
    try {
        await renameWorld(oldName, newName);
        toast({ title: 'World Renamed', description: `"${oldName}" is now "${newName}".` });
        setEditingWorld(null);
        fetchWorlds();
    } catch(e) {
         toast({ variant: 'destructive', title: 'Error', description: 'Could not rename world.' });
    }
  };

  const handleExport = async (worldName: string) => {
     try {
      const dataToExport = await exportWorldData(worldName);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `tresspasser_world_${worldName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Export Successful", description: `"${worldName}" data has been downloaded.` });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export the data." });
    }
  }

  return (
    <MainLayout showImportExport={true}>
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
                  <Button size="lg">Get Started</Button>
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
            <h2 className="text-2xl font-bold text-center mb-8">Your Worlds</h2>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading worlds...</p>
            ) : worlds.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {worlds.map((world) => (
                  <Card key={world} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{world}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <Button asChild className="w-full">
                        <a href={`#/${world.toLowerCase().replace(/\s+/g, '-')}`}>Enter World</a>
                      </Button>
                    </CardContent>
                    <CardFooter className="gap-2">
                       <Button variant="ghost" size="icon" onClick={() => setEditingWorld({ oldName: world, newName: world })}><Edit/></Button>
                       <Button variant="ghost" size="icon" onClick={() => handleExport(world)}><Download/></Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2/></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{world}"?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone. All data for this world will be permanently deleted.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteWorld(world)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No worlds found. Create one to get started!</p>
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
