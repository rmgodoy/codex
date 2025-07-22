
"use client";

import { useState, useEffect } from 'react';
import MainLayout from '@/components/main-layout';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Item } from '@/lib/types';
import ItemListPanel from '@/components/item-list-panel';
import ItemEditorPanel from '@/components/item-editor-panel';

type SortByType = 'name' | 'type' | 'price' | 'quality';

interface ItemsPageProps {
  selectedId?: string;
}

export default function ItemsPage({ selectedId }: ItemsPageProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(selectedId || null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [templateData, setTemplateData] = useState<Partial<Item> | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [magicTierFilter, setMagicTierFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  useEffect(() => {
    setIsClient(true);
    if (selectedId) {
        setSelectedItemId(selectedId);
        if (isMobile) {
            setMobileView('editor');
        }
    }
  }, [selectedId, isMobile]);

  const filters = {
    searchTerm,
    typeFilter,
    qualityFilter,
    magicTierFilter,
    tagFilter,
    sortBy,
    sortOrder
  };

  const setFilters = {
    setSearchTerm,
    setTypeFilter,
    setQualityFilter,
    setMagicTierFilter,
    setTagFilter,
    setSortBy,
    setSortOrder
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setQualityFilter('all');
    setMagicTierFilter('all');
    setTagFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectItem = (id: string | null) => {
    setSelectedItemId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewItem = () => {
    setSelectedItemId(null);
    setIsCreatingNew(true);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };
  
  const handleUseAsTemplate = (itemData: Item) => {
    const template = { ...itemData };
    const baseName = (itemData.name || 'item').replace(/^(Copy of\s*)+/, '');
    template.name = `Copy of ${baseName}`;
    delete template.id;

    setSelectedItemId(null);
    setIsCreatingNew(true);
    setTemplateData(template);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onSaveSuccess = (id: string) => {
    refreshList();
    setSelectedItemId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onDeleteSuccess = () => {
    refreshList();
    setSelectedItemId(null);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('list');
    }
  };
  
  const handleBack = () => {
    setMobileView('list');
    setSelectedItemId(null);
    setIsCreatingNew(false);
    setTemplateData(null);
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
            <ItemListPanel
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
                <ItemEditorPanel
                  key={selectedItemId ?? (isCreatingNew ? 'new' : 'placeholder')}
                  itemId={selectedItemId}
                  isCreatingNew={isCreatingNew}
                  template={templateData}
                  onSaveSuccess={onSaveSuccess}
                  onDeleteSuccess={onDeleteSuccess}
                  onUseAsTemplate={handleUseAsTemplate}
                  onEditCancel={onEditCancel}
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
            <ItemListPanel
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
              <ItemEditorPanel
                key={selectedItemId ?? (isCreatingNew ? 'new' : 'placeholder')}
                itemId={selectedItemId}
                isCreatingNew={isCreatingNew}
                template={templateData}
                onSaveSuccess={onSaveSuccess}
                onDeleteSuccess={onDeleteSuccess}
                onUseAsTemplate={handleUseAsTemplate}
                onEditCancel={onEditCancel}
              />
            </div>
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
