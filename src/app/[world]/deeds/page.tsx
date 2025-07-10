
"use client";

import { useState, useEffect } from 'react';
import DeedListPanel from '@/components/deed-list-panel';
import DeedEditorPanel from '@/components/deed-editor-panel';
import MainLayout from '@/components/main-layout';
import type { Deed } from '@/lib/types';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWorld } from '@/components/world-provider';

type SortByType = 'name' | 'tier';

export default function DeedsPage() {
  const { worldSlug } = useWorld();
  const [selectedDeedId, setSelectedDeedId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [templateData, setTemplateData] = useState<Partial<Deed> | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
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
    tierFilter,
    tagFilter,
    sortBy,
    sortOrder
  };

  const setFilters = {
    setSearchTerm,
    setTierFilter,
    setTagFilter,
    setSortBy,
    setSortOrder
  };

  const handleFilterByClick = (updates: Partial<{ tierFilter: 'light' | 'heavy' | 'mighty', tagFilter: string }>, e: React.MouseEvent) => {
    const isAdditive = e.shiftKey;

    if (!isAdditive) {
      setTierFilter(updates.tierFilter || 'all');
      setTagFilter(updates.tagFilter || '');
    } else {
      if (updates.tierFilter) setTierFilter(updates.tierFilter);
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
    setTierFilter('all');
    setTagFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectDeed = (id: string | null) => {
    setSelectedDeedId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewDeed = () => {
    setSelectedDeedId(null);
    setIsCreatingNew(true);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleUseAsTemplate = (deedData: Deed) => {
    const template = { ...deedData };
    template.name = `Copy of ${deedData.name || 'deed'}`;
    delete template.id;

    setSelectedDeedId(null);
    setIsCreatingNew(true);
    setTemplateData(template);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onDeedSaveSuccess = (id: string) => {
    refreshList();
    setSelectedDeedId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onDeedDeleteSuccess = () => {
    refreshList();
    setSelectedDeedId(null);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('list');
    }
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedDeedId(null);
    setIsCreatingNew(false);
    setTemplateData(null);
  };
  
  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedDeedId(null);
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
      <MainLayout pageTitle="Deeds" worldSlug={worldSlug}>
        <div className="h-full w-full">
          {mobileView === 'list' ? (
            <DeedListPanel
              onSelectDeed={handleSelectDeed}
              onNewDeed={handleNewDeed}
              selectedDeedId={selectedDeedId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="h-full w-full overflow-y-auto">
              <div className="p-4 sm:p-6">
                <DeedEditorPanel
                  key={selectedDeedId ?? (isCreatingNew ? 'new' : 'placeholder')}
                  deedId={selectedDeedId}
                  isCreatingNew={isCreatingNew}
                  template={templateData}
                  onDeedSaveSuccess={onDeedSaveSuccess}
                  onDeedDeleteSuccess={onDeedDeleteSuccess}
                  onUseAsTemplate={handleUseAsTemplate}
                  onEditCancel={onEditCancel}
                  dataVersion={dataVersion}
                  onFilterByClick={handleFilterByClick}
                  onBack={handleBack}
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
      <MainLayout pageTitle="Deeds" worldSlug={worldSlug}>
        <div className="flex w-full h-full overflow-hidden">
          <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
              <DeedListPanel
                  onSelectDeed={handleSelectDeed}
                  onNewDeed={handleNewDeed}
                  selectedDeedId={selectedDeedId}
                  dataVersion={dataVersion}
                  filters={filters}
                  setFilters={setFilters}
                  onClearFilters={clearFilters}
              />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 w-full">
                <DeedEditorPanel
                    key={selectedDeedId ?? (isCreatingNew ? 'new' : 'placeholder')}
                    deedId={selectedDeedId}
                    isCreatingNew={isCreatingNew}
                    template={templateData}
                    onDeedSaveSuccess={onDeedSaveSuccess}
                    onDeedDeleteSuccess={onDeedDeleteSuccess}
                    onUseAsTemplate={handleUseAsTemplate}
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

