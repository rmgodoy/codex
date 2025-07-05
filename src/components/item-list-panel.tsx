
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllItems } from '@/lib/idb';
import type { Item, ItemMagicTier } from '@/lib/types';
import { ITEM_TYPES, ITEM_QUALITIES, ITEM_MAGIC_TIERS } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TagInput } from '@/components/ui/tag-input';

type SortByType = 'name' | 'type' | 'price' | 'quality';

interface ItemListPanelProps {
  onSelectItem: (id: string | null) => void;
  onNewItem: () => void;
  selectedItemId: string | null;
  dataVersion: number;
  filters: {
    searchTerm: string;
    typeFilter: string;
    qualityFilter: string;
    magicTierFilter: string;
    tagFilter: string;
    sortBy: SortByType;
    sortOrder: 'asc' | 'desc';
  };
  setFilters: {
    setSearchTerm: (value: string) => void;
    setTypeFilter: (value: string) => void;
    setQualityFilter: (value: string) => void;
    setMagicTierFilter: (value: string) => void;
    setTagFilter: (value: string) => void;
    setSortBy: (value: SortByType) => void;
    setSortOrder: (value: 'asc' | 'desc' | ((prev: 'asc' | 'desc') => 'asc' | 'desc')) => void;
  };
  onClearFilters: () => void;
}

export default function ItemListPanel({ 
  onSelectItem, 
  onNewItem, 
  selectedItemId, 
  dataVersion,
  filters,
  setFilters,
  onClearFilters,
}: ItemListPanelProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        setItems(await getAllItems());
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch items from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [dataVersion, toast]);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
        const matchesType = filters.typeFilter === 'all' || item.type === filters.typeFilter;
        const matchesQuality = filters.qualityFilter === 'all' || item.quality === filters.qualityFilter;
        const matchesMagicTier = filters.magicTierFilter === 'all' || item.magicTier === filters.magicTierFilter;
        
        let matchesTags = true;
        const tags = filters.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) {
          matchesTags = item.tags ? tags.every(tag => item.tags!.some(dt => dt.toLowerCase().includes(tag))) : false;
        }

        return matchesSearch && matchesType && matchesQuality && matchesMagicTier && matchesTags;
    });

    const qualityOrder: Record<string, number> = { crude: 0, normal: 1, fine: 2, magical: 3 };
    const sorted = filtered.sort((a, b) => {
        if (filters.sortBy === 'quality') {
            const qualityA = qualityOrder[a.quality] || 0;
            const qualityB = qualityOrder[b.quality] || 0;
            const qualityDiff = qualityA - qualityB;
            if (qualityDiff !== 0) return qualityDiff;
        }
        if (filters.sortBy === 'price') {
            const priceDiff = (a.price || 0) - (b.price || 0);
            if (priceDiff !== 0) return priceDiff;
        }
        if (filters.sortBy === 'type') {
            const typeCompare = a.type.localeCompare(b.type);
            if (typeCompare !== 0) return typeCompare;
        }
        return a.name.localeCompare(b.name);
    });

    if (filters.sortOrder === 'desc') {
        sorted.reverse();
    }

    return sorted;
  }, [items, filters]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={onNewItem} className="w-full">
          <PlusCircle /> New Item
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
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
             <Select value={filters.typeFilter} onValueChange={setFilters.setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by type" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {ITEM_TYPES.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filters.qualityFilter} onValueChange={setFilters.setQualityFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by quality" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Qualities</SelectItem>
                    {ITEM_QUALITIES.map(q => <SelectItem key={q} value={q} className="capitalize">{q}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filters.magicTierFilter} onValueChange={(value) => setFilters.setMagicTierFilter(value as ItemMagicTier | 'all')}>
                <SelectTrigger><SelectValue placeholder="Filter by Tier" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    {ITEM_MAGIC_TIERS.map(q => <SelectItem key={q} value={q} className="capitalize">{q}</SelectItem>)}
                </SelectContent>
            </Select>
            <TagInput
              value={filters.tagFilter ? filters.tagFilter.split(',').map(t => t.trim()).filter(Boolean) : []}
              onChange={(tags) => setFilters.setTagFilter(tags.join(','))}
              placeholder="Tags (e.g. consumable)"
              tagSource="item"
            />
        </div>
         <div>
            <Label>Sort by</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.sortBy} onValueChange={(value: SortByType) => setFilters.setSortBy(value)}>
                  <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
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
            <p className="text-muted-foreground text-center">Loading items...</p>
          ) : filteredAndSortedItems.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => onSelectItem(item.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedItemId === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {item.name} 
                    <span className="text-xs opacity-70 capitalize"> ({item.type}{item.magicTier !== 'normal' ? `, ${item.magicTier}` : ''})</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No items found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
