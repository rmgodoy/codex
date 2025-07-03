

"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllEncounters, getAllEncounterTables } from '@/lib/idb';
import type { Encounter, EncounterTable } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TagInput } from '@/components/ui/tag-input';

type SortByType = 'name' | 'TR';

interface EncounterListPanelProps {
  onSelectEncounter: (id: string | null) => void;
  onNewEncounter: () => void;
  selectedEncounterId: string | null;
  dataVersion: number;
  filters: {
    searchTerm: string;
    tagFilter: string;
    minTR: string;
    maxTR: string;
    sortBy: SortByType;
    sortOrder: 'asc' | 'desc';
  };
  setFilters: {
    setSearchTerm: (value: string) => void;
    setTagFilter: (value: string) => void;
    setMinTR: (value: string) => void;
    setMaxTR: (value: string) => void;
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
  const [allEncounterTables, setAllEncounterTables] = useState<EncounterTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [encountersData, tablesData] = await Promise.all([
          getAllEncounters(),
          getAllEncounterTables(),
        ]);
        setEncounters(encountersData);
        setAllEncounterTables(tablesData);
      } catch (error) {
        console.error("Error fetching encounters:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch encounters from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [dataVersion, toast]);

  const filteredAndSortedEncounters = useMemo(() => {
    const encountersWithCorrectTR = encounters.map(enc => {
      if (enc.encounterTableId) {
          const table = allEncounterTables.find(t => t.id === enc.encounterTableId);
          return { ...enc, totalTR: table?.totalTR || enc.totalTR || 0 };
      }
      return { ...enc, totalTR: enc.totalTR || 0 };
    });

    let filtered = encountersWithCorrectTR.filter(encounter => {
      const matchesSearch = encounter.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      let matchesTags = true;
      const tags = filters.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        matchesTags = encounter.tags ? tags.every(tag => encounter.tags!.some(dt => dt.toLowerCase().includes(tag))) : false;
      }

      let matchesTR = true;
      if (filters.minTR && !isNaN(parseInt(filters.minTR))) {
        matchesTR = matchesTR && encounter.totalTR >= parseInt(filters.minTR, 10);
      }
      if (filters.maxTR && !isNaN(parseInt(filters.maxTR))) {
        matchesTR = matchesTR && encounter.totalTR <= parseInt(filters.maxTR, 10);
      }

      return matchesSearch && matchesTags && matchesTR;
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
  }, [encounters, allEncounterTables, filters]);

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
            <TagInput
              value={filters.tagFilter ? filters.tagFilter.split(',').map(t => t.trim()).filter(Boolean) : []}
              onChange={(tags) => setFilters.setTagFilter(tags.join(','))}
              placeholder="Tags (e.g. boss-fight)"
              tagSource="encounter"
            />
            <div className="flex gap-2">
                <Input placeholder="Min TR" type="number" value={filters.minTR} onChange={e => setFilters.setMinTR(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                <Input placeholder="Max TR" type="number" value={filters.maxTR} onChange={e => setFilters.setMaxTR(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
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
                    onClick={() => onSelectEncounter(encounter.id)}
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
