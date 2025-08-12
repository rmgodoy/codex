
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllNpcs, getAllFactions, getAllRaces } from '@/lib/idb';
import type { Npc, Faction, Race } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TagInput } from '@/components/ui/tag-input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';

type SortByType = 'name' | 'race';

interface NpcListPanelProps {
  onSelectNpc: (id: string | null) => void;
  onNewNpc: () => void;
  selectedNpcId: string | null;
  dataVersion: number;
  filters: {
    searchTerm: string;
    tagFilter: string;
    factionFilter: string[];
    beliefFilter: string[];
    raceFilter: string[];
    sortBy: SortByType;
    sortOrder: 'asc' | 'desc';
  };
  setFilters: {
    setSearchTerm: (value: string) => void;
    setTagFilter: (value: string) => void;
    setFactionFilter: (value: string[]) => void;
    setBeliefFilter: (value: string[]) => void;
    setRaceFilter: (value: string[]) => void;
    setSortBy: (value: SortByType) => void;
    setSortOrder: (value: 'asc' | 'desc' | ((prev: 'asc' | 'desc') => 'asc' | 'desc')) => void;
  };
  onClearFilters: () => void;
}

export default function NpcListPanel({ 
  onSelectNpc, 
  onNewNpc, 
  selectedNpcId, 
  dataVersion,
  filters,
  setFilters,
  onClearFilters,
}: NpcListPanelProps) {
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [npcsData, factionsData, racesData] = await Promise.all([getAllNpcs(), getAllFactions(), getAllRaces()]);
        setNpcs(npcsData);
        setFactions(factionsData);
        setRaces(racesData);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch NPC, faction, or race data from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dataVersion, toast]);

  const raceMap = useMemo(() => new Map(races.map(r => [r.id, r.name])), [races]);

  const filteredAndSortedNpcs = useMemo(() => {
    let filtered = npcs.filter(npc => {
      const matchesSearch = npc.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      let matchesTags = true;
      const tags = filters.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        matchesTags = npc.tags ? tags.every(tag => npc.tags!.some(dt => dt.toLowerCase().includes(tag))) : false;
      }

      let matchesFactions = true;
      if (filters.factionFilter.length > 0) {
        matchesFactions = filters.factionFilter.every(factionId => npc.factionIds?.includes(factionId));
      }

      let matchesRaces = true;
      if (filters.raceFilter.length > 0) {
          matchesRaces = !!npc.raceId && filters.raceFilter.includes(npc.raceId);
      }

      return matchesSearch && matchesTags && matchesFactions && matchesRaces;
    });

    const sorted = filtered.sort((a, b) => {
      if (filters.sortBy === 'race') {
        const raceA = a.raceId ? raceMap.get(a.raceId) || '' : '';
        const raceB = b.raceId ? raceMap.get(b.raceId) || '' : '';
        const raceCompare = raceA.localeCompare(raceB);
        if (raceCompare !== 0) return raceCompare;
      }
      return a.name.localeCompare(b.name);
    });

    if (filters.sortOrder === 'desc') {
      sorted.reverse();
    }

    return sorted;
  }, [npcs, filters, raceMap]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={onNewNpc} className="w-full">
          <PlusCircle /> New NPC
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search NPCs..."
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
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        {filters.factionFilter.length > 0
                        ? `${filters.factionFilter.length} faction(s) selected`
                        : 'Filter by Faction'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <ScrollArea className="h-48">
                    {factions.map(faction => (
                        <div key={faction.id} className="flex items-center space-x-2 p-2 hover:bg-accent">
                            <Checkbox 
                                id={`filter-faction-${faction.id}`} 
                                checked={filters.factionFilter.includes(faction.id)}
                                onCheckedChange={(checked) => {
                                    const newFilter = checked
                                        ? [...filters.factionFilter, faction.id]
                                        : filters.factionFilter.filter(id => id !== faction.id);
                                    setFilters.setFactionFilter(newFilter);
                                }}
                            />
                            <Label htmlFor={`filter-faction-${faction.id}`} className="font-normal flex-1">{faction.name}</Label>
                        </div>
                    ))}
                  </ScrollArea>
                </PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        {filters.raceFilter.length > 0
                        ? `${filters.raceFilter.length} race(s) selected`
                        : 'Filter by Race'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <ScrollArea className="h-48">
                    {races.map(race => (
                        <div key={race.id} className="flex items-center space-x-2 p-2 hover:bg-accent">
                            <Checkbox 
                                id={`filter-race-${race.id}`} 
                                checked={filters.raceFilter.includes(race.id)}
                                onCheckedChange={(checked) => {
                                    const newFilter = checked
                                        ? [...filters.raceFilter, race.id]
                                        : filters.raceFilter.filter(id => id !== race.id);
                                    setFilters.setRaceFilter(newFilter);
                                }}
                            />
                            <Label htmlFor={`filter-race-${race.id}`} className="font-normal flex-1">{race.name}</Label>
                        </div>
                    ))}
                  </ScrollArea>
                </PopoverContent>
            </Popover>
            <TagInput
              value={filters.tagFilter ? filters.tagFilter.split(',').map(t => t.trim()).filter(Boolean) : []}
              onChange={(tags) => setFilters.setTagFilter(tags.join(','))}
              placeholder="Tags..."
              tagSource="npc"
            />
        </div>
         <div>
            <Label>Sort by</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.sortBy} onValueChange={(value: 'name' | 'race') => setFilters.setSortBy(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="race">Race</SelectItem>
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
            <p className="text-muted-foreground text-center">Loading NPCs...</p>
          ) : filteredAndSortedNpcs.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedNpcs.map(npc => (
                <li key={npc.id}>
                  <button
                    onClick={() => onSelectNpc(npc.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedNpcId === npc.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {npc.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No NPCs found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
