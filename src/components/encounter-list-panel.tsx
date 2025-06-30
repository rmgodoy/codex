
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllEncounters, getAllCreatures } from '@/lib/idb';
import type { Encounter, Creature } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, Tag, ArrowUp, ArrowDown } from 'lucide-react';
import { useSidebar } from './ui/sidebar';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type SortByType = 'name' | 'TR';

interface EncounterListPanelProps {
  onSelectEncounter: (id: string | null) => void;
  onNewEncounter: () => void;
  selectedEncounterId: string | null;
  dataVersion: number;
  filters: {
    searchTerm: string;
    tagFilter: string;
    sortBy: SortByType;
    sortOrder: 'asc' | 'desc';
  };
  setFilters: {
    setSearchTerm: (value: string) => void;
    setTagFilter: (value: string) => void;
    setSortBy: (value: SortByType) => void;
    setSortOrder: (value: 'asc' | 'desc' | ((prev: 'asc' | 'desc') => 'asc' | 'desc')) => void;
  };
  onClearFilters: () => void;
}

export default function EncounterListPanel({ 
  onSelectEncounter, 
  onNewEncounter, 
  selectedEncounterId, 
  dataVersion,
  filters,
  setFilters,
  onClearFilters,
}: EncounterListPanelProps) {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [allCreatures, setAllCreatures] = useState<Creature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [encountersData, creaturesData] = await Promise.all([
          getAllEncounters(),
          getAllCreatures()
        ]);
        setEncounters(encountersData);
        setAllCreatures(creaturesData);
      } catch (error) {
        console.error("Error fetching encounters:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch encounters from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [dataVersion, toast]);
  
  const handleSelectEncounter = (id: string) => {
    onSelectEncounter(id);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filteredAndSortedEncounters = useMemo(() => {
    const creatureTRMap = new Map(allCreatures.map(c => [c.id, c.TR]));

    let encountersWithTR = encounters.map(enc => {
      // Use saved TR if available, otherwise calculate it for backward compatibility
      const totalTR = enc.totalTR ?? (enc.monsterGroups || []).reduce((acc, group) => {
          const tr = creatureTRMap.get(group.monsterId) || 0;
          return acc + (tr * group.quantity);
      }, 0);
      return { ...enc, totalTR };
    });

    let filtered = encountersWithTR.filter(encounter => {
      const matchesSearch = encounter.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      let matchesTags = true;
      const tags = filters.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        matchesTags = encounter.tags ? tags.every(tag => encounter.tags!.some(dt => dt.toLowerCase().includes(tag))) : false;
      }

      return matchesSearch && matchesTags;
    });

    const sorted = filtered.sort((a, b) => {
      if (filters.sortBy === 'TR') {
        const trA = a.totalTR ?? 0;
        const trB = b.totalTR ?? 0;
        const trDiff = trA - trB;
        if (trDiff !== 0) return trDiff;
      }
      return a.name.localeCompare(b.name);
    });

    if (filters.sortOrder === 'desc') {
      sorted.reverse();
    }
    
    return sorted;
  }, [encounters, allCreatures, filters]);

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
            value={filters.searchTerm}
            onChange={(e) => setFilters.setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Filter</Label>
              <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs h-auto p-1">Clear</Button>
            </div>
            <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tags (e.g. boss-fight)" value={filters.tagFilter} onChange={e => setFilters.setTagFilter(e.target.value)} className="pl-9"/>
            </div>
        </div>
         <div>
            <Label>Sort by</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.sortBy} onValueChange={(value: 'name' | 'TR') => setFilters.setSortBy(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="TR">TR</SelectItem>
                  </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => setFilters.setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}>
                  {filters.sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  <span className="sr-only">Toggle sort order</span>
              </Button>
            </div>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <p className="text-muted-foreground text-center">Loading encounters...</p>
          ) : filteredAndSortedEncounters.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedEncounters.map(encounter => (
                <li key={encounter.id}>
                  <button
                    onClick={() => handleSelectEncounter(encounter.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedEncounterId === encounter.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {encounter.name} <span className="text-xs opacity-70">(TR {encounter.totalTR})</span>
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
