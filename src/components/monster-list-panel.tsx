

"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { getAllCreatures, getCreaturesWithDeedsByIds } from '@/lib/idb';
import type { Creature, CreatureTemplate, CreatureWithDeeds } from '@/lib/types';
import { ROLES, type Role } from '@/lib/roles';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Search, ArrowUp, ArrowDown, Download, Loader2 } from 'lucide-react';
import { TagInput } from '@/components/ui/tag-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import CreatureExportCard from './creature-export-card';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';


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
  
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [creatureToRender, setCreatureToRender] = useState<CreatureWithDeeds | null>(null);
  const [exportProgress, setExportProgress] = useState("");
  const exportCardRef = useRef<HTMLDivElement>(null);
  
  const initialExportFilters = {
    searchTerm: '',
    roleFilter: 'all',
    templateFilter: 'all',
    minLevel: '',
    maxLevel: '',
    minTR: '',
    maxTR: '',
    tagFilter: '',
  };
  const [exportFilters, setExportFilters] = useState(initialExportFilters);


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
  
  const handleExport = async () => {
    if (selectedForExport.size === 0) {
        toast({
            variant: "destructive",
            title: "No creatures selected",
            description: "Please select at least one creature to export.",
        });
        return;
    }

    setIsExporting(true);
    toast({ title: "Starting Export...", description: `Preparing ${selectedForExport.size} creature(s).` });

    try {
        const creaturesToExport = await getCreaturesWithDeedsByIds(Array.from(selectedForExport));
        const zip = new JSZip();
        let count = 1;

        for (const creature of creaturesToExport) {
            setCreatureToRender(creature);
            setExportProgress(`Exporting ${count} of ${creaturesToExport.length}: ${creature.name}`);
            
            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50))); 

            if (exportCardRef.current) {
                try {
                    const dataUrl = await htmlToImage.toPng(exportCardRef.current, { 
                        quality: 1, 
                        pixelRatio: 2,
                        backgroundColor: '#e7e5e4',
                    });
                    const blob = await (await fetch(dataUrl)).blob();
                    zip.file(`${creature.name.replace(/ /g, '_')}.png`, blob);
                } catch (error) {
                    console.error(`Failed to export ${creature.name}:`, error);
                    toast({ variant: 'destructive', title: `Failed to export ${creature.name}`});
                }
            }
            count++;
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = "exported_creatures.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: 'Export finished!', description: `${creaturesToExport.length} creature(s) have been exported.` });
    } catch (error) {
        console.error("Export failed", error);
        toast({ variant: "destructive", title: "Export Failed", description: "An unexpected error occurred." });
    } finally {
        setIsExporting(false);
        setCreatureToRender(null);
        setExportProgress("");
        setIsExportDialogOpen(false);
        setSelectedForExport(new Set());
    }
  };

  const applyFilters = (creatureList: Creature[], filterSet: typeof filters | typeof exportFilters) => {
    return creatureList.filter(creature => {
      const matchesSearch = creature.name.toLowerCase().includes(filterSet.searchTerm.toLowerCase());
      const matchesRole = filterSet.roleFilter === 'all' || creature.role === filterSet.roleFilter;
      const matchesTemplate = filterSet.templateFilter === 'all' || creature.template === filterSet.templateFilter;

      let matchesLevel = true;
      if (filterSet.minLevel && !isNaN(parseInt(filterSet.minLevel))) {
        matchesLevel = matchesLevel && creature.level >= parseInt(filterSet.minLevel, 10);
      }
      if (filterSet.maxLevel && !isNaN(parseInt(filterSet.maxLevel))) {
        matchesLevel = matchesLevel && creature.level <= parseInt(filterSet.maxLevel, 10);
      }

      let matchesTR = true;
      if (filterSet.minTR && !isNaN(parseInt(filterSet.minTR))) {
        matchesTR = matchesTR && creature.TR >= parseInt(filterSet.minTR, 10);
      }
      if (filterSet.maxTR && !isNaN(parseInt(filterSet.maxTR))) {
        matchesTR = matchesTR && creature.TR <= parseInt(filterSet.maxTR, 10);
      }

      let matchesTags = true;
      if (filterSet.tagFilter) {
        const tags = filterSet.tagFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) {
          matchesTags = creature.tags && creature.tags.length > 0 && tags.every(tag => creature.tags!.some(ct => ct.toLowerCase().includes(tag)));
        }
      }
      
      return matchesSearch && matchesRole && matchesTemplate && matchesLevel && matchesTR && matchesTags;
    });
  };

  const filteredForExport = useMemo(() => applyFilters(creatures, exportFilters), [creatures, exportFilters]);

  const filteredAndSortedCreatures = useMemo(() => {
    let filtered = applyFilters(creatures, filters);

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
  
  const handleSelectAllVisible = () => {
    const visibleIds = new Set(filteredForExport.map(c => c.id));
    setSelectedForExport(prev => new Set([...Array.from(prev), ...Array.from(visibleIds)]));
  };
  
  const handleDeselectAllVisible = () => {
    const visibleIds = new Set(filteredForExport.map(c => c.id));
    setSelectedForExport(prev => {
        const newSet = new Set(prev);
        visibleIds.forEach(id => newSet.delete(id));
        return newSet;
    });
  };

  return (
    <>
      <Dialog open={isExporting}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
            <DialogTitle>Exporting Creatures</DialogTitle>
            <DialogDescription>
                Please wait while the creature cards are being generated.
            </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 p-4">
                <div className="min-h-[200px]">
                    <div ref={exportCardRef}>
                        {creatureToRender && <CreatureExportCard creature={creatureToRender} />}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>{exportProgress}</span>
                </div>
            </div>
        </DialogContent>
      </Dialog>
      <div className="border-r border-border bg-card flex flex-col h-full">
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
              <Button onClick={onNewCreature} className="w-full">
                <PlusCircle /> New Creature
              </Button>
              <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="px-3" title="Export as PNG">
                    <Download />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Export Creatures to PNG</DialogTitle>
                    <DialogDescription>Select the creatures you want to export. They will be downloaded as a single ZIP file.</DialogDescription>
                  </DialogHeader>
                    <div className="flex gap-4">
                        <div className="w-64 flex-shrink-0 space-y-4">
                            <h4 className="font-semibold">Filters</h4>
                            <Input placeholder="Search..." value={exportFilters.searchTerm} onChange={e => setExportFilters(f => ({...f, searchTerm: e.target.value}))} />
                             <Select value={exportFilters.templateFilter} onValueChange={v => setExportFilters(f => ({...f, templateFilter: v}))}>
                                <SelectTrigger><SelectValue placeholder="All Templates" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Templates</SelectItem>
                                    {TEMPLATES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={exportFilters.roleFilter} onValueChange={v => setExportFilters(f => ({...f, roleFilter: v}))}>
                                <SelectTrigger><SelectValue placeholder="All Roles" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <div className="flex gap-2">
                                <Input placeholder="Min Lvl" type="number" value={exportFilters.minLevel} onChange={e => setExportFilters(f => ({...f, minLevel: e.target.value}))} />
                                <Input placeholder="Max Lvl" type="number" value={exportFilters.maxLevel} onChange={e => setExportFilters(f => ({...f, maxLevel: e.target.value}))} />
                            </div>
                            <div className="flex gap-2">
                                <Input placeholder="Min TR" type="number" value={exportFilters.minTR} onChange={e => setExportFilters(f => ({...f, minTR: e.target.value}))} />
                                <Input placeholder="Max TR" type="number" value={exportFilters.maxTR} onChange={e => setExportFilters(f => ({...f, maxTR: e.target.value}))} />
                            </div>
                            <TagInput
                                value={exportFilters.tagFilter ? exportFilters.tagFilter.split(',').map(t => t.trim()).filter(Boolean) : []}
                                onChange={(tags) => setExportFilters(f => ({...f, tagFilter: tags.join(',')}))}
                                placeholder="Tags..."
                                tagSource="creature"
                            />
                            <Button variant="ghost" className="w-full" onClick={() => setExportFilters(initialExportFilters)}>Clear Filters</Button>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <Label>{selectedForExport.size} of {filteredForExport.length} selected</Label>
                                <div className="flex gap-2">
                                    <Button variant="link" className="p-0 h-auto" onClick={handleSelectAllVisible}>Select All Visible</Button>
                                    <Button variant="link" className="p-0 h-auto" onClick={handleDeselectAllVisible}>Deselect All Visible</Button>
                                </div>
                            </div>
                            <ScrollArea className="h-64 border rounded-md">
                                <div className="p-4 space-y-2">
                                    {filteredForExport.map(creature => (
                                        <div key={creature.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`export-${creature.id}`}
                                                checked={selectedForExport.has(creature.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedForExport(prev => {
                                                        const newSet = new Set(prev);
                                                        if (checked) newSet.add(creature.id);
                                                        else newSet.delete(creature.id);
                                                        return newSet;
                                                    });
                                                }}
                                            />
                                            <Label htmlFor={`export-${creature.id}`} className="font-normal">{creature.name}</Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                  <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleExport} disabled={isExporting || selectedForExport.size === 0}>
                          {isExporting ? 'Exporting...' : `Export ${selectedForExport.size} Creature(s)`}
                      </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </div>
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
              <TagInput
                value={filters.tagFilter ? filters.tagFilter.split(',').map(t => t.trim()).filter(Boolean) : []}
                onChange={(tags) => setFilters.setTagFilter(tags.join(','))}
                placeholder="Tags (e.g. undead, goblin)"
                tagSource="creature"
              />
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
                      onClick={() => onSelectCreature(creature.id)}
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
    </>
  );
}
