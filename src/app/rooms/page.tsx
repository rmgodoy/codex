
"use client";

import { useState, useEffect } from 'react';
import MainLayout from '@/components/main-layout';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Room } from '@/lib/types';
import RoomListPanel from '@/components/room-list-panel';
import RoomEditorPanel from '@/components/room-editor-panel';

type SortByType = 'name';

export default function RoomsPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
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
    const isAdditive = e.shiftKey;

    if (!isAdditive) {
      setTagFilter(updates.tagFilter || '');
    } else {
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
    setSortBy('name');
    setSortOrder('asc');
  };

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectItem = (id: string | null) => {
    setSelectedRoomId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewItem = () => {
    setSelectedRoomId(null);
    setIsCreatingNew(true);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onSaveSuccess = (id: string) => {
    refreshList();
    setSelectedRoomId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onDeleteSuccess = () => {
    refreshList();
    setSelectedRoomId(null);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('list');
    }
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedRoomId(null);
    setIsCreatingNew(false);
  };
  
  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedRoomId(null);
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
            <RoomListPanel
              onSelectItem={handleSelectItem}
              onNewItem={handleNewItem}
              selectedItemId={selectedRoomId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="p-4 sm:p-6 h-full w-full overflow-y-auto">
              <RoomEditorPanel
                key={selectedRoomId ?? (isCreatingNew ? 'new' : 'placeholder')}
                roomId={selectedRoomId}
                isCreatingNew={isCreatingNew}
                onSaveSuccess={onSaveSuccess}
                onDeleteSuccess={onDeleteSuccess}
                onEditCancel={onEditCancel}
                onFilterByClick={handleFilterByClick}
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
              <RoomListPanel
                  onSelectItem={handleSelectItem}
                  onNewItem={handleNewItem}
                  selectedItemId={selectedRoomId}
                  dataVersion={dataVersion}
                  filters={filters}
                  setFilters={setFilters}
                  onClearFilters={clearFilters}
              />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 h-full w-full">
                <RoomEditorPanel
                    key={selectedRoomId ?? (isCreatingNew ? 'new' : 'placeholder')}
                    roomId={selectedRoomId}
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
