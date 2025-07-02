
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllAlchemicalItems } from '@/lib/idb';
import type { AlchemicalItem, AlchemicalItemTier, AlchemicalItemType } from '@/lib/types';
import { ALCHEMY_ITEM_TIERS, ALCHEMY_ITEM_TYPES } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, Tag, ArrowUp, ArrowDown } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type SortByType = 'name' | 'tier' | 'cost';

interface AlchemyListPanelProps {
  onSelectItem: (id: string | null) => void;
  onNewItem: () => void;
  selectedItemId: string | null;
  dataVersion: number;
  filters: {
    searchTerm: string;
    tierFilter: string;
    typeFilter: string;
    tagFilter: string;
    sortBy: SortByType;
    sortOrder: 'asc' | 'desc';
  };
  setFilters: {
    setSearchTerm: (value: string) => void;
    setTierFilter: (value: string) => void;
    setTypeFilter: (value: string) => void;
    setTagFilter: (value: string) => void;
    setSortBy: (value: SortByType) => void;
    setSortOrder: (value: 'asc' | 'desc' | ((prev: 'asc' | 'desc') => 'asc' | 'desc')) => void;
  };
  onClearFilters: () => void;
}

export default function AlchemyListPanel({ 
  onSelectItem, 
  onNewItem, 
  selectedItemId, 
  dataVersion,
  filters,
  setFilters,
  onClearFilters,
}: AlchemyListPanelProps) {
  const [items, setItems] = useState<AlchemicalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const itemsData = await getAllAlchemicalItems();
        setItems(itemsData);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch alchemy items from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [dataVersion, toast]);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
        const matchesTier = filters.tierFilter === 'all' || item.tier === filters.tierFilter;
        const matchesType = filters.typeFilter === 'all' || item.type === filters.typeFilter;
        
        let matchesTags = true;
        const tags = filters.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) {
          matchesTags = item.tags ? tags.every(tag => item.tags!.some(dt => dt.toLowerCase().includes(tag))) : false;
        }

        return matchesSearch && matchesTier && matchesType && matchesTags;
    });

    const tierOrder: Record<string, number> = { lesser: 1, greater: 2 };
    const sorted = filtered.sort((a, b) => {
        if (filters.sortBy === 'tier') {
            const tierA = tierOrder[a.tier] || 0;
            const tierB = tierOrder[b.tier] || 0;
            const tierDiff = tierA - tierB;
            if (tierDiff !== 0) return tierDiff;
        }
        if (filters.sortBy === 'cost') {
            const costDiff = a.cost - b.cost;
            if (costDiff !== 0) return costDiff;
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
          <PlusCircle /> New Alchemical Item
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
                <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {ALCHEMY_ITEM_TYPES.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filters.tierFilter} onValueChange={setFilters.setTierFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    {ALCHEMY_ITEM_TIERS.map(tier => <SelectItem key={tier} value={tier} className="capitalize">{tier}</SelectItem>)}
                </SelectContent>
            </Select>
            <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tags (e.g. buff, damage)" value={filters.tagFilter} onChange={e => setFilters.setTagFilter(e.target.value)} className="pl-9"/>
            </div>
        </div>
         <div>
            <Label>Sort by</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.sortBy} onValueChange={(value: 'name' | 'tier' | 'cost') => setFilters.setSortBy(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="tier">Tier</SelectItem>
                      <SelectItem value="cost">Cost</SelectItem>
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
                    {item.name} <span className="text-xs opacity-70 capitalize">({item.tier})</span>
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
