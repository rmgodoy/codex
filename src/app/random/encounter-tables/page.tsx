
"use client";

import { useState, useEffect } from 'react';
import MainLayout from '@/components/main-layout';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import type { EncounterTable } from '@/lib/types';
import EncounterTableListPanel from '@/components/encounter-table-list-panel';
import EncounterTableEditorPanel from '@/components/encounter-table-editor-panel';

type SortByType = 'name' | 'TR';

export default function EncounterTablesPage() {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
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

  const clearFilters = () => {
    setSearchTerm('');
    setTagFilter('');
    setMinTR('');
    setMaxTR('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectTable = (id: string | null) => {
    setSelectedTableId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewTable = () => {
    setSelectedTableId(null);
    setIsCreatingNew(true);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onSaveSuccess = (id: string) => {
    refreshList();
    setSelectedTableId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onDeleteSuccess = () => {
    refreshList();
    setSelectedTableId(null);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('list');
    }
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedTableId(null);
    setIsCreatingNew(false);
  };
  
  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedTableId(null);
      if (isMobile) {
        setMobileView('list');
      }
    }
  };

  if (!isClient) {
    return null;
  }

  if (isMobile) {
    return (
      <MainLayout showSidebarTrigger={false}>
        <div className="h-full w-full">
          {mobileView === 'list' ? (
            <EncounterTableListPanel
              onSelectTable={handleSelectTable}
              onNewTable={handleNewTable}
              selectedTableId={selectedTableId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="p-4 sm:p-6 h-full w-full overflow-y-auto">
              <EncounterTableEditorPanel
                key={selectedTableId ?? (isCreatingNew ? 'new' : 'placeholder')}
                tableId={selectedTableId}
                isCreatingNew={isCreatingNew}
                onSaveSuccess={onSaveSuccess}
                onDeleteSuccess={onDeleteSuccess}
                onEditCancel={onEditCancel}
                onBack={handleBack}
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
            <EncounterTableListPanel
              onSelectTable={handleSelectTable}
              onNewTable={handleNewTable}
              selectedTableId={selectedTableId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 h-full w-full">
              <EncounterTableEditorPanel
                key={selectedTableId ?? (isCreatingNew ? 'new' : 'placeholder')}
                tableId={selectedTableId}
                isCreatingNew={isCreatingNew}
                onSaveSuccess={onSaveSuccess}
                onDeleteSuccess={onDeleteSuccess}
                onEditCancel={onEditCancel}
              />
            </div>
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
