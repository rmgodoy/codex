
"use client";

import { useState, useEffect } from 'react';
import NpcListPanel from '@/components/npc-list-panel';
import NpcEditorPanel from '@/components/npc-editor-panel';
import MainLayout from '@/components/main-layout';
import type { Npc } from '@/lib/types';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

type SortByType = 'name' | 'race';

export default function NpcsPage() {
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [templateData, setTemplateData] = useState<Partial<Npc> | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [factionFilter, setFactionFilter] = useState<string[]>([]);
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
    factionFilter,
    sortBy,
    sortOrder,
  };

  const setFilters = {
    setSearchTerm,
    setTagFilter,
    setFactionFilter,
    setSortBy,
    setSortOrder,
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTagFilter('');
    setFactionFilter([]);
    setSortBy('name');
    setSortOrder('asc');
  };

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectNpc = (id: string | null) => {
    setSelectedNpcId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewNpc = () => {
    setSelectedNpcId(null);
    setIsCreatingNew(true);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleUseAsTemplate = (npcData: Npc) => {
    const template = { ...npcData };
    const baseName = (npcData.name || 'NPC').replace(/^(Copy of\s*)+/, '');
    template.name = `Copy of ${baseName}`;
    delete (template as Partial<Npc>).id;

    setSelectedNpcId(null);
    setIsCreatingNew(true);
    setTemplateData(template);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onSaveSuccess = (id: string) => {
    refreshList();
    setSelectedNpcId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onDeleteSuccess = () => {
    refreshList();
    setSelectedNpcId(null);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('list');
    }
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedNpcId(null);
    setIsCreatingNew(false);
    setTemplateData(null);
  };

  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedNpcId(null);
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
            <NpcListPanel
              onSelectNpc={handleSelectNpc}
              onNewNpc={handleNewNpc}
              selectedNpcId={selectedNpcId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="p-4 sm:p-6 h-full w-full overflow-y-auto">
              <NpcEditorPanel
                key={selectedNpcId ?? (isCreatingNew ? 'new' : 'placeholder')}
                npcId={selectedNpcId}
                isCreatingNew={isCreatingNew}
                template={templateData}
                onSaveSuccess={onSaveSuccess}
                onDeleteSuccess={onDeleteSuccess}
                onUseAsTemplate={handleUseAsTemplate}
                onEditCancel={onEditCancel}
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
            <NpcListPanel
              onSelectNpc={handleSelectNpc}
              onNewNpc={handleNewNpc}
              selectedNpcId={selectedNpcId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 w-full">
              <NpcEditorPanel
                key={selectedNpcId ?? (isCreatingNew ? 'new' : 'placeholder')}
                npcId={selectedNpcId}
                isCreatingNew={isCreatingNew}
                template={templateData}
                onSaveSuccess={onSaveSuccess}
                onDeleteSuccess={onDeleteSuccess}
                onUseAsTemplate={handleUseAsTemplate}
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
