
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAllCreatures } from '@/lib/idb';
import type { Creature, CreatureTemplate } from '@/lib/types';
import { ROLES, type Role } from '@/lib/roles';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

type SortByType = 'name' | 'TR' | 'level';

const TEMPLATES: CreatureTemplate[] = ['Normal', 'Underling', 'Paragon', 'Tyrant'];

interface CreatureListPanelProps {
  onSelectCreature: (id: string | null) => void;
  onNewCreature: () => void;
  selectedCreatureId: string | null;
  dataVersion: number;
  filters: {
    searchTerm: string;
    roleFilter: string;
    templateFilter: string;
    minLevel: string;
    maxLevel: string;
    minTR: string;
    maxTR: string;
    tagFilter: string;
    sortBy: SortByType;
    sortOrder: 'asc' | 'desc';
  };
  setFilters: {
    setSearchTerm: (value: string) => void;
    setRoleFilter: (value: string) => void;
    setTemplateFilter: (value: string) => void;
    setMinLevel: (value: string) => void;
    setMaxLevel: (value: string) => void;
    setMinTR: (value: string) => void;
    setMaxTR: (value: string) => void;
    setTagFilter: (value: string) => void;
    setSortBy: (value: SortByType) => void;
    setSortOrder: (value: 'asc' | 'desc' | ((prev: 'asc' | 'desc') => 'asc' | 'desc')) => void;
  };
  onClearFilters: () => void;
}

export default function CreatureListPanel({ 
  onSelectCreature, 
  onNewCreature, 
  selectedCreatureId, 
  dataVersion, 
  filters,
  setFilters,
  onClearFilters
}: CreatureListPanelProps) {
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    const fetchCreatures = async () => {
      setIsLoading(true);
      try {
        const creaturesData = await getAllCreatures();
        setCreatures(creaturesData);
      } catch (error) {
        console.error("Error fetching creatures:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch creatures from database." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCreatures();
  }, [dataVersion, toast]);

  const filteredAndSortedCreatures = useMemo(() => {
    let filtered = creatures.filter(creature => {
      const matchesSearch = creature.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesRole = filters.roleFilter === 'all' || creature.role === filters.roleFilter;
      const matchesTemplate = filters.templateFilter === 'all' || creature.template === filters.templateFilter;

      let matchesLevel = true;
      if (filters.minLevel && !isNaN(parseInt(filters.minLevel))) {
        matchesLevel = matchesLevel && creature.level >= parseInt(filters.minLevel, 10);
      }
      if (filters.maxLevel && !isNaN(parseInt(filters.maxLevel))) {
        matchesLevel = matchesLevel && creature.level <= parseInt(filters.maxLevel, 10);
      }

      let matchesTR = true;
      if (filters.minTR && !isNaN(parseInt(filters.minTR))) {
        matchesTR = matchesTR && creature.TR >= parseInt(filters.minTR, 10);
      }
      if (filters.maxTR && !isNaN(parseInt(filters.maxTR))) {
        matchesTR = matchesTR && creature.TR <= parseInt(filters.maxTR, 10);
      }

      let matchesTags = true;
      if (filters.tagFilter) {
        const tags = filters.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) {
          matchesTags = creature.tags && creature.tags.length > 0 && tags.every(tag => creature.tags!.some(ct => ct.toLowerCase().includes(tag)));
        }
      }
      
      return matchesSearch && matchesRole && matchesTemplate && matchesLevel && matchesTR && matchesTags;
    });

    const sorted = filtered.sort((a, b) => {
      if (filters.sortBy === 'TR') {
        const trDiff = a.TR - b.TR;
        if (trDiff !== 0) return trDiff;
      }
      if (filters.sortBy === 'level') {
        const levelDiff = a.level - b.level;
        if (levelDiff !== 0) return levelDiff;
      }
      return a.name.localeCompare(b.name);
    });

    if (filters.sortOrder === 'desc') {
      sorted.reverse();
    }
    
    return sorted;
  }, [creatures, filters]);


  const handleSelectCreature = (id: string) => {
    onSelectCreature(id);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <div className="border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button onClick={onNewCreature} className="w-full">
          <PlusCircle /> New Creature
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creatures..."
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
             <Select value={filters.templateFilter} onValueChange={setFilters.setTemplateFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by template" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    {TEMPLATES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filters.roleFilter} onValueChange={setFilters.setRoleFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
            </Select>
            <div className="flex gap-2">
                <Input placeholder="Min Lvl" type="number" value={filters.minLevel} onChange={e => setFilters.setMinLevel(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                <Input placeholder="Max Lvl" type="number" value={filters.maxLevel} onChange={e => setFilters.setMaxLevel(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>
            <div className="flex gap-2">
                <Input placeholder="Min TR" type="number" value={filters.minTR} onChange={e => setFilters.setMinTR(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                <Input placeholder="Max TR" type="number" value={filters.maxTR} onChange={e => setFilters.setMaxTR(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>
            <Input placeholder="Tags (e.g. undead, goblin)" value={filters.tagFilter} onChange={e => setFilters.setTagFilter(e.target.value)} />
        </div>

        <div>
            <Label>Sort by</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.sortBy} onValueChange={(value: 'name' | 'TR' | 'level') => setFilters.setSortBy(value)}>
                  <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="TR">TR</SelectItem>
                      <SelectItem value="level">Level</SelectItem>
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
            <p className="text-muted-foreground text-center">Loading creatures...</p>
          ) : filteredAndSortedCreatures.length > 0 ? (
            <ul className="space-y-1">
              {filteredAndSortedCreatures.map(creature => (
                <li key={creature.id}>
                  <button
                    onClick={() => handleSelectCreature(creature.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedCreatureId === creature.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/50'}`}
                  >
                    {creature.name} <span className="text-xs opacity-70">(Lvl {creature.level} / TR {creature.TR})</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">No creatures found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
