
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllEncounters } from '@/lib/idb';
import type { Encounter } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search } from 'lucide-react';
import { useSidebar } from './ui/sidebar';

interface EncounterListPanelProps {
  onSelectEncounter: (id: string | null) => void;
  onNewEncounter: () => void;
  selectedEncounterId: string | null;
  dataVersion: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function EncounterListPanel({ 
  onSelectEncounter, 
  onNewEncounter, 
  selectedEncounterId, 
  dataVersion,
  searchTerm,
  setSearchTerm,
}: EncounterListPanelProps) {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    const fetchEncounters = async () => {
      setIsLoading(true);
      try {
        const encountersData = await getAllEncounters();
        setEncounters(encountersData);
      } catch (error) {
        console.error("Error fetching encounters:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch encounters from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEncounters();
  }, [dataVersion, toast]);
  
  const handleSelectEncounter = (id: string) => {
    onSelectEncounter(id);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filteredEncounters = useMemo(() => {
    return encounters
      .filter(encounter => encounter.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [encounters, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={onNewEncounter} className="w-full">
          <PlusCircle /> New Encounter
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search encounters..."
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
            <p className="text-muted-foreground text-center">Loading encounters...</p>
          ) : filteredEncounters.length > 0 ? (
            <ul className="space-y-1">
              {filteredEncounters.map(encounter => (
                <li key={encounter.id}>
                  <button
                    onClick={() => handleSelectEncounter(encounter.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedEncounterId === encounter.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {encounter.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No encounters found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
