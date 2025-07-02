
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllTreasures } from '@/lib/idb';
import type { Treasure } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TagInput } from '@/components/ui/tag-input';

type SortByType = 'name' | 'value';

interface TreasureListPanelProps {
  onSelectTreasure: (id: string | null) => void;
  onNewTreasure: () => void;
  selectedTreasureId: string | null;
  dataVersion: number;
  filters: {
    searchTerm: string;
    tagFilter: string;
    minValue: string;
    maxValue: string;
    sortBy: SortByType;
    sortOrder: 'asc' | 'desc';
  };
  setFilters: {
    setSearchTerm: (value: string) => void;
    setTagFilter: (value: string) => void;
    setMinValue: (value: string) => void;
    setMaxValue: (value: string) => void;
    setSortBy: (value: SortByType) => void;
    setSortOrder: (value: 'asc' | 'desc' | ((prev: 'asc' | 'desc') => 'asc' | 'desc')) => void;
  };
  onClearFilters: () => void;
}

export default function TreasureListPanel({ 
  onSelectTreasure, 
  onNewTreasure, 
  selectedTreasureId, 
  dataVersion,
  filters,
  setFilters,
  onClearFilters,
}: TreasureListPanelProps) {
  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        setTreasures(await getAllTreasures());
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch treasures from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [dataVersion, toast]);

  const filteredAndSortedTreasures = useMemo(() => {
    let filtered = treasures.filter(treasure => {
      const matchesSearch = treasure.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      let matchesTags = true;
      const tags = filters.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        matchesTags = treasure.tags ? tags.every(tag => treasure.tags!.some(dt => dt.toLowerCase().includes(tag))) : false;
      }

      let matchesValue = true;
      if (filters.minValue && !isNaN(parseInt(filters.minValue))) {
        matchesValue = matchesValue && treasure.value >= parseInt(filters.minValue, 10);
      }
      if (filters.maxValue && !isNaN(parseInt(filters.maxValue))) {
        matchesValue = matchesValue && treasure.value <= parseInt(filters.maxValue, 10);
      }

      return matchesSearch && matchesTags && matchesValue;
    });

    const sorted = filtered.sort((a, b) => {
      if (filters.sortBy === 'value') {
        const valueA = a.value ?? 0;
        const valueB = b.value ?? 0;
        const valueDiff = valueA - valueB;
        if (valueDiff !== 0) return valueDiff;
      }
      return a.name.localeCompare(b.name);
    });

    if (filters.sortOrder === 'desc') {
      sorted.reverse();
    }
    
    return sorted;
  }, [treasures, filters]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={onNewTreasure} className="w-full">
          <PlusCircle /> New Treasure
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search treasures..."
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
              placeholder="Tags..."
            />
            <div className="flex gap-2">
                <Input placeholder="Min Value" type="number" value={filters.minValue} onChange={e => setFilters.setMinValue(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                <Input placeholder="Max Value" type="number" value={filters.maxValue} onChange={e => setFilters.setMaxValue(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>
        </div>
         <div>
            <Label>Sort by</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.sortBy} onValueChange={(value: 'name' | 'value') => setFilters.setSortBy(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="value">Value</SelectItem>
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
            <p className="text-muted-foreground text-center">Loading treasures...</p>
          ) : filteredAndSortedTreasures.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedTreasures.map(treasure => (
                <li key={treasure.id}>
                  <button
                    onClick={() => onSelectTreasure(treasure.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedTreasureId === treasure.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {treasure.name} <span className="text-xs opacity-70">(Value {treasure.value})</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No treasures found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
