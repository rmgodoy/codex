
"use client";

import { useState, useEffect } from 'react';
import MainLayout from '@/components/main-layout';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import CityListPanel from '@/components/city-list-panel';
import CityEditorPanel from '@/components/city-editor-panel';

type SortByType = 'name';

export default function CitiesPage() {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  const refreshList = () => setDataVersion(v => v + 1);

  useEffect(() => {
    setIsClient(true);
    
    const handleFocus = () => {
      refreshList();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
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

  const handleSelectCity = (id: string | null) => {
    setSelectedCityId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewCity = () => {
    setSelectedCityId(null);
    setIsCreatingNew(true);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onSaveSuccess = (id: string) => {
    refreshList();
    setSelectedCityId(id);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onDeleteSuccess = () => {
    refreshList();
    setSelectedCityId(null);
    setIsCreatingNew(false);
    if (isMobile) {
      setMobileView('list');
    }
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedCityId(null);
    setIsCreatingNew(false);
  };

  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedCityId(null);
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
            <CityListPanel
              onSelectCity={handleSelectCity}
              onNewCity={handleNewCity}
              selectedCityId={selectedCityId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="h-full w-full overflow-y-auto">
              <div className="p-4 sm:p-6">
                <CityEditorPanel
                  key={selectedCityId ?? (isCreatingNew ? 'new' : 'placeholder')}
                  cityId={selectedCityId}
                  isCreatingNew={isCreatingNew}
                  onSaveSuccess={onSaveSuccess}
                  onDeleteSuccess={onDeleteSuccess}
                  onEditCancel={onEditCancel}
                  onBack={handleBack}
                  dataVersion={dataVersion}
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
            <CityListPanel
              onSelectCity={handleSelectCity}
              onNewCity={handleNewCity}
              selectedCityId={selectedCityId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 w-full">
              <CityEditorPanel
                key={selectedCityId ?? (isCreatingNew ? 'new' : 'placeholder')}
                cityId={selectedCityId}
                isCreatingNew={isCreatingNew}
                onSaveSuccess={onSaveSuccess}
                onDeleteSuccess={onDeleteSuccess}
                onEditCancel={onEditCancel}
                dataVersion={dataVersion}
              />
            </div>
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
