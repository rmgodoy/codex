
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Creature } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Download, Upload, Search } from 'lucide-react';

interface CreatureListPanelProps {
  onSelectCreature: (id: string) => void;
  onNewCreature: () => void;
  selectedCreatureId: string | null;
}

export default function CreatureListPanel({ onSelectCreature, onNewCreature, selectedCreatureId }: CreatureListPanelProps) {
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [minTR, setMinTR] = useState('');
  const [maxTR, setMaxTR] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'TR'>('name');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const creaturesCollection = collection(db, 'creatures');
    const unsubscribe = onSnapshot(creaturesCollection, (snapshot) => {
      const creaturesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creature));
      setCreatures(creaturesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching creatures:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch creatures from database." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const filteredAndSortedCreatures = useMemo(() => {
    let filtered = creatures.filter(creature => 
      creature.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (minTR && !isNaN(parseInt(minTR))) {
      filtered = filtered.filter(c => c.TR >= parseInt(minTR, 10));
    }
    if (maxTR && !isNaN(parseInt(maxTR))) {
      filtered = filtered.filter(c => c.TR <= parseInt(maxTR, 10));
    }

    if (tagFilter) {
      const tags = tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        filtered = filtered.filter(c => c.tags && c.tags.length > 0 && tags.every(tag => c.tags.some(ct => ct.toLowerCase().includes(tag))));
      }
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'TR') {
        const trDiff = a.TR - b.TR;
        if (trDiff !== 0) return trDiff;
      }
      return a.name.localeCompare(b.name);
    });
  }, [creatures, searchTerm, minTR, maxTR, tagFilter, sortBy]);


  const handleExport = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'creatures'));
      const creaturesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // This is a temp fix for bad data in DB
        const { level, ...rest } = data;
        if (level && !rest.TR) {
          rest.TR = level;
        }
        return { id: doc.id, ...rest };
      });
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(creaturesData, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "tresspasser_bestiary.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Export Successful", description: "Your bestiary has been downloaded." });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export the bestiary." });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error("File content could not be read as text.");
        }
        const importedCreatures: Partial<Creature>[] = JSON.parse(content);
        if (!Array.isArray(importedCreatures)) throw new Error("JSON must be an array of creatures.");

        const batch = writeBatch(db);
        const existingDocs = await getDocs(collection(db, 'creatures'));
        existingDocs.forEach(doc => batch.delete(doc.ref));

        importedCreatures.forEach(creature => {
          const { id, ...data } = creature;
          const newDocRef = id ? doc(db, 'creatures', id) : doc(collection(db, 'creatures'));
          batch.set(newDocRef, data);
        });

        await batch.commit();
        toast({ title: "Import Successful", description: "Bestiary has been overwritten with the imported data." });
      } catch (error: any) {
        console.error("Import failed:", error);
        toast({ variant: "destructive", title: "Import Failed", description: error.message || "Please check the file format and content." });
      } finally {
        if(fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={onNewCreature} className="w-full">
          <PlusCircle /> New Creature
        </Button>
        <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" className="w-full">
                  <Upload /> Import
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Import Bestiary?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will overwrite your entire existing bestiary with the data from the selected JSON file. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => fileInputRef.current?.click()}>
                    Proceed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          <Button variant="secondary" onClick={handleExport} className="w-full">
            <Download /> Export
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creatures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2">
            <Label>Filter</Label>
            <div className="flex gap-2">
                <Input placeholder="Min TR" type="number" value={minTR} onChange={e => setMinTR(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                <Input placeholder="Max TR" type="number" value={maxTR} onChange={e => setMaxTR(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>
            <Input placeholder="Tags (e.g. undead, goblin)" value={tagFilter} onChange={e => setTagFilter(e.target.value)} />
        </div>

        <div>
            <Label>Sort by</Label>
            <Select value={sortBy} onValueChange={(value: 'name' | 'TR') => setSortBy(value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
            </Select>
        </div>

      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <p className="text-muted-foreground text-center">Loading creatures...</p>
          ) : filteredAndSortedCreatures.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedCreatures.map(creature => (
                <li key={creature.id}>
                  <button
                    onClick={() => onSelectCreature(creature.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedCreatureId === creature.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {creature.name} <span className="text-xs opacity-70">(TR {creature.TR})</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No creatures found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
