
"use client";

import { useState, useEffect } from 'react';
import PantheonListPanel from '@/components/pantheon-list-panel';
import PantheonEditorPanel from '@/components/pantheon-editor-panel';
import MainLayout from '@/components/main-layout';
import type { PantheonEntity } from '@/lib/types';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

type SortByType = 'name' | 'domain';

export default function PantheonPage() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
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

  const handleFilterByClick = (updates: Partial<{ tagFilter: string }>, e: React.MouseEvent) => {
    e.stopPropagation();
    setTagFilter(updates.tagFilter || '');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTagFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectEntity = (id: string | null) => {
    setSelectedEntityId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewEntity = () => {
    setSelectedEntityId(null);
    setIsCreatingNew(true);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onSaveSuccess = (id: string) => {
    refreshList();
    setSelectedEntityId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onDeleteSuccess = () => {
    refreshList();
    setSelectedEntityId(null);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('list');
    }
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedEntityId(null);
    setIsCreatingNew(false);
  };

  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedEntityId(null);
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
            <PantheonListPanel
              onSelectEntity={handleSelectEntity}
              onNewEntity={handleNewEntity}
              selectedEntityId={selectedEntityId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="h-full w-full overflow-y-auto">
              <div className="p-4 sm:p-6">
                <PantheonEditorPanel
                  key={selectedEntityId ?? (isCreatingNew ? 'new' : 'placeholder')}
                  entityId={selectedEntityId}
                  isCreatingNew={isCreatingNew}
                  onSaveSuccess={onSaveSuccess}
                  onDeleteSuccess={onDeleteSuccess}
                  onEditCancel={onEditCancel}
                  onBack={handleBack}
                  dataVersion={dataVersion}
                  onFilterByClick={handleFilterByClick}
                />
              </div>
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
            <PantheonListPanel
              onSelectEntity={handleSelectEntity}
              onNewEntity={handleNewEntity}
              selectedEntityId={selectedEntityId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 w-full">
              <PantheonEditorPanel
                key={selectedEntityId ?? (isCreatingNew ? 'new' : 'placeholder')}
                entityId={selectedEntityId}
                isCreatingNew={isCreatingNew}
                onSaveSuccess={onSaveSuccess}
                onDeleteSuccess={onDeleteSuccess}
                onEditCancel={onEditCancel}
                dataVersion={dataVersion}
                onFilterByClick={handleFilterByClick}
              />
            </div>
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
