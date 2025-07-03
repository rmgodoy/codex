
"use client";

import { useState, useEffect } from 'react';
import MainLayout from "@/components/main-layout";
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import EncounterListPanel from '@/components/encounter-list-panel';
import EncounterEditorPanel from '@/components/encounter-editor-panel';
import LiveEncounterView from '@/components/live-encounter-view';
import type { Encounter } from '@/lib/types';
import { getEncounterById } from '@/lib/idb';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

type EncounterViewMode = 'preparation' | 'live';
type SortByType = 'name' | 'TR';

export default function EncountersPage() {
  const [mode, setMode] = useState<EncounterViewMode>('preparation');
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [liveEncounter, setLiveEncounter] = useState<Encounter | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [minTR, setMinTR] = useState('');
  const [maxTR, setMaxTR] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filters = {
    searchTerm,
    tagFilter,
    minTR,
    maxTR,
    sortBy,
    sortOrder,
  };

  const setFilters = {
    setSearchTerm,
    setTagFilter,
    setMinTR,
    setMaxTR,
    setSortBy,
    setSortOrder,
  };

  const handleFilterByClick = (updates: Partial<{ minTR: number; maxTR: number; tagFilter: string }>, e: React.MouseEvent) => {
    const isAdditive = e.shiftKey;

    if (!isAdditive) {
      // Clear filters and apply the new one
      setMinTR(updates.minTR !== undefined ? String(updates.minTR) : '');
      setMaxTR(updates.maxTR !== undefined ? String(updates.maxTR) : '');
      setTagFilter(updates.tagFilter || '');
    } else {
      // Additive filtering
      if (updates.minTR !== undefined) setMinTR(String(updates.minTR));
      if (updates.maxTR !== undefined) setMaxTR(String(updates.maxTR));
      if (updates.tagFilter) {
        setTagFilter(prev => {
          if (!prev) return updates.tagFilter!;
          const existingTags = prev.split(',').map(t => t.trim());
          if (!existingTags.includes(updates.tagFilter!)) {
            return `${prev}, ${updates.tagFilter}`;
          }
          return prev;
        });
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTagFilter('');
    setMinTR('');
    setMaxTR('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectEncounter = (id: string | null) => {
    setSelectedEncounterId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewEncounter = () => {
    setSelectedEncounterId(null);
    setIsCreatingNew(true);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onEncounterSaveSuccess = (id: string) => {
    refreshList();
    setSelectedEncounterId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onEncounterDeleteSuccess = () => {
    refreshList();
    setSelectedEncounterId(null);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('list');
    }
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedEncounterId(null);
    setIsCreatingNew(false);
  };
  
  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedEncounterId(null);
      if (isMobile) {
        setMobileView('list');
      }
    }
  };

  const { toast } = useToast();
  const handleRunEncounter = async (id: string) => {
    try {
      const encounterData = await getEncounterById(id);
      if (encounterData) {
        setLiveEncounter(encounterData);
        setMode('live');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find encounter to run.' });
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to load encounter data.' });
    }
  };

  const handleEndEncounter = () => {
    setLiveEncounter(null);
    setMode('preparation');
  };

  if (mode === 'live' && liveEncounter) {
    return (
      <LiveEncounterView
        encounter={liveEncounter}
        onEndEncounter={handleEndEncounter}
      />
    );
  }
  
  if (!isClient) {
    return null;
  }

  if (isMobile) {
    return (
      <MainLayout showSidebarTrigger={false}>
        <div className="h-full w-full">
          {mobileView === 'list' ? (
            <EncounterListPanel
              onSelectEncounter={handleSelectEncounter}
              onNewEncounter={handleNewEncounter}
              selectedEncounterId={selectedEncounterId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="p-4 sm:p-6 h-full w-full overflow-y-auto">
              <EncounterEditorPanel
                key={selectedEncounterId ?? (isCreatingNew ? 'new' : 'placeholder')}
                encounterId={selectedEncounterId}
                isCreatingNew={isCreatingNew}
                onEncounterSaveSuccess={onEncounterSaveSuccess}
                onEncounterDeleteSuccess={onEncounterDeleteSuccess}
                onEditCancel={onEditCancel}
                onRunEncounter={handleRunEncounter}
                onFilterByClick={handleFilterByClick}
                onBack={handleBack}
                dataVersion={dataVersion}
              />
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  return (
    <SidebarProvider>
      <MainLayout>
        <div className="flex w-full h-full overflow-hidden">
          <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
            <EncounterListPanel
              onSelectEncounter={handleSelectEncounter}
              onNewEncounter={handleNewEncounter}
              selectedEncounterId={selectedEncounterId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 w-full">
              <EncounterEditorPanel
                key={selectedEncounterId ?? (isCreatingNew ? 'new' : 'placeholder')}
                encounterId={selectedEncounterId}
                isCreatingNew={isCreatingNew}
                onEncounterSaveSuccess={onEncounterSaveSuccess}
                onEncounterDeleteSuccess={onEncounterDeleteSuccess}
                onEditCancel={onEditCancel}
                onRunEncounter={handleRunEncounter}
                onFilterByClick={handleFilterByClick}
                dataVersion={dataVersion}
              />
            </div>
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
