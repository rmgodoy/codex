
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllDeeds } from '@/lib/idb';
import type { Deed } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DeedListPanelProps {
  onSelectDeed: (id: string | null) => void;
  selectedDeedId: string | null;
  dataVersion: number;
}

export default function DeedListPanel({ onSelectDeed, selectedDeedId, dataVersion }: DeedListPanelProps) {
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDeeds = async () => {
      setIsLoading(true);
      try {
        const deedsData = await getAllDeeds();
        setDeeds(deedsData);
      } catch (error) {
        console.error("Error fetching deeds:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch deeds from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeeds();
  }, [dataVersion, toast]);
  
  const handleNewDeed = () => {
    onSelectDeed(null);
  };

  const filteredAndSortedDeeds = useMemo(() => {
    let filtered = deeds.filter(deed => {
        const matchesSearch = deed.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTier = tierFilter === 'all' || deed.tier === tierFilter;
        return matchesSearch && matchesTier;
    });
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [deeds, searchTerm, tierFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={handleNewDeed} className="w-full">
          <PlusCircle /> New Deed
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deeds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger>
                <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
                <SelectItem value="mighty">Mighty</SelectItem>
            </SelectContent>
        </Select>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <p className="text-muted-foreground text-center">Loading deeds...</p>
          ) : filteredAndSortedDeeds.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedDeeds.map(deed => (
                <li key={deed.id}>
                  <button
                    onClick={() => onSelectDeed(deed.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedDeedId === deed.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {deed.name} <span className="text-xs opacity-70">({deed.tier})</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No deeds found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
