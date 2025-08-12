

"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllFactions } from '@/lib/idb';
import type { Faction } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TagInput } from '@/components/ui/tag-input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type SortByType = 'name';

interface FactionListPanelProps {
  onSelectFaction: (id: string | null) => void;
  onNewFaction: () => void;
  selectedFactionId: string | null;
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

export default function FactionListPanel({ 
  onSelectFaction, 
  onNewFaction, 
  selectedFactionId, 
  dataVersion,
  filters,
  setFilters,
  onClearFilters,
}: FactionListPanelProps) {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFactions = async () => {
      setIsLoading(true);
      try {
        setFactions(await getAllFactions());
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch factions from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFactions();
  }, [dataVersion, toast]);

  const filteredAndSortedFactions = useMemo(() => {
    let filtered = factions.filter(faction => {
      const matchesSearch = faction.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      let matchesTags = true;
      const tags = filters.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        matchesTags = faction.tags ? tags.every(tag => faction.tags!.some(dt => dt.toLowerCase().includes(tag))) : false;
      }

      return matchesSearch && matchesTags;
    });

    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (filters.sortOrder === 'desc') {
      sorted.reverse();
    }

    return sorted;
  }, [factions, filters]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={onNewFaction} className="w-full">
          <PlusCircle /> New Faction
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search factions..."
            value={filters.searchTerm}
            onChange={(e) => setFilters.setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Collapsible>
            <div className="flex justify-between items-center">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="-ml-2">
                        <Filter className="h-4 w-4 mr-2"/>
                        Filters
                    </Button>
                </CollapsibleTrigger>
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs h-auto p-1">Clear</Button>
            </div>
            <CollapsibleContent className="space-y-2 pt-2">
                <TagInput
                    value={filters.tagFilter ? filters.tagFilter.split(',').map(t => t.trim()).filter(Boolean) : []}
                    onChange={(tags) => setFilters.setTagFilter(tags.join(','))}
                    placeholder="Tags..."
                    tagSource="faction"
                />
            </CollapsibleContent>
        </Collapsible>
         <div>
            <Label>Sort by</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.sortBy} onValueChange={(value: 'name') => setFilters.setSortBy(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
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
            <p className="text-muted-foreground text-center">Loading factions...</p>
          ) : filteredAndSortedFactions.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedFactions.map(faction => (
                <li key={faction.id}>
                  <button
                    onClick={() => onSelectFaction(faction.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedFactionId === faction.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {faction.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No factions found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
