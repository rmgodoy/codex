
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllMaps, getMapById } from '@/lib/idb';
import type { MapData } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, ArrowUp, ArrowDown, Play } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TagInput } from '@/components/ui/tag-input';
import Link from 'next/link';

interface MapListPanelProps {
  onSelectMap: (id: string | null) => void;
  onNewMap: () => void;
  selectedMapId: string | null;
  dataVersion: number;
}

export default function MapListPanel({ 
  onSelectMap, 
  onNewMap, 
  selectedMapId, 
  dataVersion,
}: MapListPanelProps) {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  useEffect(() => {
    const fetchMaps = async () => {
      setIsLoading(true);
      try {
        setMaps(await getAllMaps());
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch maps from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaps();
  }, [dataVersion, toast]);

  const filteredAndSortedMaps = useMemo(() => {
    let filtered = maps.filter(map => {
      const matchesSearch = map.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesTags = true;
      const tags = tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        matchesTags = map.tags ? tags.every(tag => map.tags!.some(dt => dt.toLowerCase().includes(tag))) : false;
      }

      return matchesSearch && matchesTags;
    });

    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (sortOrder === 'desc') {
      sorted.reverse();
    }
    
    return sorted;
  }, [maps, searchTerm, tagFilter, sortOrder]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={onNewMap} className="w-full">
          <PlusCircle /> New Map
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search maps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Filter</Label>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setTagFilter(''); }} className="text-xs h-auto p-1">Clear</Button>
            </div>
            <TagInput
              value={tagFilter ? tagFilter.split(',').map(t => t.trim()).filter(Boolean) : []}
              onChange={(tags) => setTagFilter(tags.join(','))}
              placeholder="Tags..."
              tagSource="map"
            />
        </div>
         <div>
            <Label>Sort by Name</Label>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')} className="w-full">
                  {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 mr-2" /> : <ArrowDown className="h-4 w-4 mr-2" />}
                  Toggle Order
              </Button>
            </div>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <p className="text-muted-foreground text-center">Loading maps...</p>
          ) : filteredAndSortedMaps.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedMaps.map(map => (
                <li key={map.id} className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectMap(map.id)}
                    className={`flex-1 w-full text-left p-2 rounded-md transition-colors ${selectedMapId === map.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {map.name}
                  </button>
                  <Link href={`/maps/${map.id}/live`} passHref>
                    <Button variant="ghost" size="icon" asChild>
                      <a><Play className="h-4 w-4 text-accent-foreground" /></a>
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No maps found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
