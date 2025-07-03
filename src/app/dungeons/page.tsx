

"use client";

import { useState, useEffect } from 'react';
import MainLayout from "@/components/main-layout";
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import DungeonListPanel from '@/components/dungeon-list-panel';
import DungeonEditorPanel from '@/components/dungeon-editor-panel';
import LiveDungeonView from '@/components/live-dungeon-view';
import type { Dungeon } from '@/lib/types';
import { getDungeonById } from '@/lib/idb';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

type DungeonViewMode = 'preparation' | 'live';
type SortByType = 'name' | 'threatRating';

export default function DungeonsPage() {
  const [mode, setMode] = useState<DungeonViewMode>('preparation');
  const [selectedDungeonId, setSelectedDungeonId] = useState<string | null>(null);
  const [liveDungeon, setLiveDungeon] = useState<Dungeon | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
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
    sortBy,
    sortOrder,
  };

  const setFilters = {
    setSearchTerm,
    setTagFilter,
    setSortBy,
    setSortOrder,
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTagFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectDungeon = (id: string | null) => {
    setSelectedDungeonId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewDungeon = () => {
    setSelectedDungeonId(null);
    setIsCreatingNew(true);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onSaveSuccess = (id: string) => {
    refreshList();
    setSelectedDungeonId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onDeleteSuccess = () => {
    refreshList();
    setSelectedDungeonId(null);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('list');
    }
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedDungeonId(null);
    setIsCreatingNew(false);
  };
  
  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedDungeonId(null);
      if (isMobile) {
        setMobileView('list');
      }
    }
  };

  const { toast } = useToast();
  const handleRunDungeon = async (id: string) => {
    try {
      const dungeonData = await getDungeonById(id);
      if (dungeonData) {
        setLiveDungeon(dungeonData);
        setMode('live');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find dungeon to run.' });
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to load dungeon data.' });
    }
  };

  const handleEndDungeon = () => {
    setLiveDungeon(null);
    setMode('preparation');
  };

  if (mode === 'live' && liveDungeon) {
    return (
      <LiveDungeonView
        dungeon={liveDungeon}
        onEndDungeon={handleEndDungeon}
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
            <DungeonListPanel
              onSelectDungeon={handleSelectDungeon}
              onNewDungeon={handleNewDungeon}
              selectedDungeonId={selectedDungeonId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="p-4 sm:p-6 h-full w-full overflow-y-auto">
              <DungeonEditorPanel
                key={selectedDungeonId ?? (isCreatingNew ? 'new' : 'placeholder')}
                dungeonId={selectedDungeonId}
                isCreatingNew={isCreatingNew}
                onSaveSuccess={onSaveSuccess}
                onDeleteSuccess={onDeleteSuccess}
                onEditCancel={onEditCancel}
                onRunDungeon={handleRunDungeon}
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
            <DungeonListPanel
              onSelectDungeon={handleSelectDungeon}
              onNewDungeon={handleNewDungeon}
              selectedDungeonId={selectedDungeonId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={onClearFilters}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 h-full w-full">
              <DungeonEditorPanel
                key={selectedDungeonId ?? (isCreatingNew ? 'new' : 'placeholder')}
                dungeonId={selectedDungeonId}
                isCreatingNew={isCreatingNew}
                onSaveSuccess={onSaveSuccess}
                onDeleteSuccess={onDeleteSuccess}
                onEditCancel={onEditCancel}
                onRunDungeon={handleRunDungeon}
                dataVersion={dataVersion}
              />
            </div>
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
