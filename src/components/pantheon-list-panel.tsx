

"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllPantheonEntities } from '@/lib/idb';
import type { PantheonEntity } from '@/lib/types';
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

type SortByType = 'name' | 'domain';

interface PantheonListPanelProps {
  onSelectEntity: (id: string | null) => void;
  onNewEntity: () => void;
  selectedEntityId: string | null;
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

export default function PantheonListPanel({ 
  onSelectEntity, 
  onNewEntity, 
  selectedEntityId, 
  dataVersion,
  filters,
  setFilters,
  onClearFilters,
}: PantheonListPanelProps) {
  const [entities, setEntities] = useState<PantheonEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEntities = async () => {
      setIsLoading(true);
      try {
        setEntities(await getAllPantheonEntities());
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch entities from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntities();
  }, [dataVersion, toast]);

  const filteredAndSortedEntities = useMemo(() => {
    let filtered = entities.filter(entity => {
      const matchesSearch = entity.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                            entity.domain.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      let matchesTags = true;
      const tags = filters.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        matchesTags = entity.tags ? tags.every(tag => entity.tags!.some(dt => dt.toLowerCase().includes(tag))) : false;
      }

      return matchesSearch && matchesTags;
    });

    const sorted = filtered.sort((a, b) => {
      if (filters.sortBy === 'domain') {
        const domainCompare = a.domain.localeCompare(b.domain);
        if (domainCompare !== 0) return domainCompare;
      }
      return a.name.localeCompare(b.name);
    });

    if (filters.sortOrder === 'desc') {
      sorted.reverse();
    }

    return sorted;
  }, [entities, filters]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={onNewEntity} className="w-full">
          <PlusCircle /> New Entity
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
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
                    tagSource="pantheon"
                />
            </CollapsibleContent>
        </Collapsible>
         <div>
            <Label>Sort by</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.sortBy} onValueChange={(value: 'name' | 'domain') => setFilters.setSortBy(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="domain">Domain</SelectItem>
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
            <p className="text-muted-foreground text-center">Loading entities...</p>
          ) : filteredAndSortedEntities.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedEntities.map(entity => (
                <li key={entity.id}>
                  <button
                    onClick={() => onSelectEntity(entity.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedEntityId === entity.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {entity.name} <span className="text-xs opacity-70">({entity.domain})</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No entities found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
