"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Monster } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Download, Upload, Search } from 'lucide-react';

interface MonsterListPanelProps {
  onSelectMonster: (id: string) => void;
  onNewMonster: () => void;
  selectedMonsterId: string | null;
}

export default function MonsterListPanel({ onSelectMonster, onNewMonster, selectedMonsterId }: MonsterListPanelProps) {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const monstersCollection = collection(db, 'monsters');
    const unsubscribe = onSnapshot(monstersCollection, (snapshot) => {
      const monstersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Monster));
      setMonsters(monstersData.sort((a, b) => a.name.localeCompare(b.name)));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching monsters:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch monsters from database." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const filteredMonsters = useMemo(() => {
    return monsters.filter(monster => monster.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [monsters, searchTerm]);

  const handleExport = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'monsters'));
      const monstersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // The ID is not part of the document data, so we manually add it for export consistency
        return { id: doc.id, ...data };
      });
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(monstersData, null, 2))}`;
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
        const importedMonsters: Partial<Monster>[] = JSON.parse(content);
        if (!Array.isArray(importedMonsters)) throw new Error("JSON must be an array of monsters.");

        const batch = writeBatch(db);
        const existingDocs = await getDocs(collection(db, 'monsters'));
        existingDocs.forEach(doc => batch.delete(doc.ref));

        importedMonsters.forEach(monster => {
          const { id, ...data } = monster;
          const newDocRef = id ? doc(db, 'monsters', id) : doc(collection(db, 'monsters'));
          batch.set(newDocRef, data);
        });

        await batch.commit();
        toast({ title: "Import Successful", description: "Bestiary has been overwritten with the imported data." });
      } catch (error: any) {
        console.error("Import failed:", error);
        toast({ variant: "destructive", title: "Import Failed", description: error.message || "Please check the file format and content." });
      } finally {
        // Reset file input
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
        <Button onClick={onNewMonster} className="w-full">
          <PlusCircle /> New Monster
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
            placeholder="Search monsters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <p className="text-muted-foreground text-center">Loading monsters...</p>
          ) : filteredMonsters.length > 0 ? (
            <ul className="space-y-1">
              {filteredMonsters.map(monster => (
                <li key={monster.id}>
                  <button
                    onClick={() => onSelectMonster(monster.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedMonsterId === monster.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {monster.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No monsters found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
