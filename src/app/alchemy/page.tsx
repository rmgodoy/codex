
"use client";

import { useState, useEffect } from 'react';
import MainLayout from '@/components/main-layout';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AlchemicalItem } from '@/lib/types';
import AlchemyListPanel from '@/components/alchemy-list-panel';
import AlchemyEditorPanel from '@/components/alchemy-editor-panel';
import { populateDefaultAlchemyData } from '@/lib/default-alchemy-data';
import { useWorld } from '@/components/world-provider';

type SortByType = 'name' | 'tier' | 'cost';

export default function AlchemyPage() {
  const { worldSlug } = useWorld();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  useEffect(() => {
    setIsClient(true);
    populateDefaultAlchemyData().then(() => {
        setDataVersion(v => v + 1);
    });
  }, []);

  const filters = {
    searchTerm,
    tierFilter,
    typeFilter,
    tagFilter,
    sortBy,
    sortOrder
  };

  const setFilters = {
    setSearchTerm,
    setTierFilter,
    setTypeFilter,
    setTagFilter,
    setSortBy,
    setSortOrder
  };

  const handleFilterByClick = (updates: Partial<{ typeFilter: string; tierFilter: string, tagFilter: string }>, e: React.MouseEvent) => {
    const isAdditive = e.shiftKey;

    if (!isAdditive) {
      setTypeFilter(updates.typeFilter || 'all');
      setTierFilter(updates.tierFilter || 'all');
      setTagFilter(updates.tagFilter || '');
    } else {
      if (updates.typeFilter) setTypeFilter(updates.typeFilter);
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
    setTypeFilter('all');
    setTagFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectItem = (id: string | null) => {
    setSelectedItemId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewItem = () => {
    setSelectedItemId(null);
    setIsCreatingNew(true);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onSaveSuccess = (id: string) => {
    refreshList();
    setSelectedItemId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onDeleteSuccess = () => {
    refreshList();
    setSelectedItemId(null);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('list');
    }
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedItemId(null);
    setIsCreatingNew(false);
  };
  
  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedItemId(null);
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
      <MainLayout>
        <div className="h-full w-full">
          {mobileView === 'list' ? (
            <AlchemyListPanel
              onSelectItem={handleSelectItem}
              onNewItem={handleNewItem}
              selectedItemId={selectedItemId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="h-full w-full overflow-y-auto">
              <div className="p-4 sm:p-6">
                <AlchemyEditorPanel
                  key={selectedItemId ?? (isCreatingNew ? 'new' : 'placeholder')}
                  itemId={selectedItemId}
                  isCreatingNew={isCreatingNew}
                  onSaveSuccess={onSaveSuccess}
                  onDeleteSuccess={onDeleteSuccess}
                  onEditCancel={onEditCancel}
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
      <MainLayout>
        <div className="flex w-full h-full overflow-hidden">
          <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
              <AlchemyListPanel
                  onSelectItem={handleSelectItem}
                  onNewItem={handleNewItem}
                  selectedItemId={selectedItemId}
                  dataVersion={dataVersion}
                  filters={filters}
                  setFilters={setFilters}
                  onClearFilters={clearFilters}
              />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 w-full">
                <AlchemyEditorPanel
                    key={selectedItemId ?? (isCreatingNew ? 'new' : 'placeholder')}
                    itemId={selectedItemId}
                    isCreatingNew={isCreatingNew}
                    onSaveSuccess={onSaveSuccess}
                    onDeleteSuccess={onDeleteSuccess}
                    onEditCancel={onEditCancel}
                    onFilterByClick={handleFilterByClick}
                />
            </div>
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
