
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllCities } from '@/lib/idb';
import type { City } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TagInput } from '@/components/ui/tag-input';

type SortByType = 'name';

interface CityListPanelProps {
  onSelectCity: (id: string | null) => void;
  onNewCity: () => void;
  selectedCityId: string | null;
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

export default function CityListPanel({ 
  onSelectCity, 
  onNewCity, 
  selectedCityId, 
  dataVersion,
  filters,
  setFilters,
  onClearFilters,
}: CityListPanelProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCities = async () => {
      setIsLoading(true);
      try {
        setCities(await getAllCities());
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch cities from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCities();
  }, [dataVersion, toast]);

  const filteredAndSortedCities = useMemo(() => {
    let filtered = cities.filter(city => {
      const matchesSearch = city.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      let matchesTags = true;
      const tags = filters.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        matchesTags = city.tags ? tags.every(tag => city.tags!.some(dt => dt.toLowerCase().includes(tag))) : false;
      }

      return matchesSearch && matchesTags;
    });

    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (filters.sortOrder === 'desc') {
      sorted.reverse();
    }

    return sorted;
  }, [cities, filters]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={onNewCity} className="w-full">
          <PlusCircle /> New City
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cities..."
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
              tagSource="city"
            />
        </div>
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
            <p className="text-muted-foreground text-center">Loading cities...</p>
          ) : filteredAndSortedCities.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedCities.map(city => (
                <li key={city.id}>
                  <button
                    onClick={() => onSelectCity(city.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedCityId === city.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {city.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No cities found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
