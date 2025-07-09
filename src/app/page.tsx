
"use client";

import { useState, useEffect } from "react";
import type { CreatureWithDeeds, Role, CreatureTemplate } from "@/lib/types";
import CreatureListPanel from "@/components/monster-list-panel";
import CreatureEditorPanel from "@/components/monster-editor-panel";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import MainLayout from "@/components/main-layout";
import { useIsMobile } from "@/hooks/use-mobile";

type SortByType = 'name' | 'TR' | 'level';

export default function Home() {
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [templateData, setTemplateData] = useState<Partial<CreatureWithDeeds> | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [minLevel, setMinLevel] = useState('');
  const [maxLevel, setMaxLevel] = useState('');
  const [minTR, setMinTR] = useState('');
  const [maxTR, setMaxTR] = useState('');
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
    roleFilter,
    templateFilter,
    minLevel,
    maxLevel,
    minTR,
    maxTR,
    tagFilter,
    sortBy,
    sortOrder
  };

  const setFilters = {
    setSearchTerm,
    setRoleFilter,
    setTemplateFilter,
    setMinLevel,
    setMaxLevel,
    setMinTR,
    setMaxTR,
    setTagFilter,
    setSortBy,
    setSortOrder
  };

  const handleFilterByClick = (updates: Partial<Omit<typeof filters, 'searchTerm' | 'sortBy' | 'sortOrder'>>, e: React.MouseEvent) => {
    const isAdditive = e.shiftKey;

    if (!isAdditive) {
      // Clear filters and apply the new one
      setRoleFilter(updates.roleFilter || 'all');
      setTemplateFilter(updates.templateFilter || 'all');
      setMinLevel(updates.minLevel !== undefined ? String(updates.minLevel) : '');
      setMaxLevel(updates.maxLevel !== undefined ? String(updates.maxLevel) : '');
      setMinTR(updates.minTR !== undefined ? String(updates.minTR) : '');
      setMaxTR(updates.maxTR !== undefined ? String(updates.maxTR) : '');
      setTagFilter(updates.tagFilter || '');
    } else {
      // Additive filtering
      if (updates.roleFilter) setRoleFilter(updates.roleFilter);
      if (updates.templateFilter) setTemplateFilter(updates.templateFilter);
      if (updates.minLevel !== undefined) setMinLevel(String(updates.minLevel));
      if (updates.maxLevel !== undefined) setMaxLevel(String(updates.maxLevel));
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
    setRoleFilter('all');
    setTemplateFilter('all');
    setMinLevel('');
    setMaxLevel('');
    setMinTR('');
    setMaxTR('');
    setTagFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectCreature = (id: string | null) => {
    setSelectedCreatureId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleNewCreature = () => {
    setSelectedCreatureId(null);
    setIsCreatingNew(true);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const handleUseAsTemplate = (creatureData: CreatureWithDeeds) => {
    const template = { ...creatureData };
    const baseName = (creatureData.name || 'creature').replace(/^(Copy of\s*)+/, '');
    template.name = `Copy of ${baseName}`;
    delete template.id;

    setSelectedCreatureId(null);
    setIsCreatingNew(true);
    setTemplateData(template);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onCreatureSaveSuccess = (id: string) => {
    refreshList();
    setSelectedCreatureId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
    if (isMobile) {
      setMobileView('editor');
    }
  };

  const onCreatureDeleteSuccess = () => {
    refreshList();
    setSelectedCreatureId(null);
    setIsCreatingNew(false); 
    setTemplateData(null);
    if (isMobile) {
      setMobileView('list');
    }
  };
  
  const handleBack = () => {
    setMobileView('list');
    setSelectedCreatureId(null);
    setIsCreatingNew(false);
    setTemplateData(null);
  };

  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedCreatureId(null);
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
            <CreatureListPanel
              onSelectCreature={handleSelectCreature}
              onNewCreature={handleNewCreature}
              selectedCreatureId={selectedCreatureId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="h-full w-full overflow-y-auto">
              <div className="p-4 sm:p-6">
                <CreatureEditorPanel
                  key={selectedCreatureId ?? (isCreatingNew ? 'new' : 'placeholder')}
                  creatureId={selectedCreatureId}
                  isCreatingNew={isCreatingNew}
                  template={templateData}
                  onCreatureSaveSuccess={onCreatureSaveSuccess}
                  onCreatureDeleteSuccess={onCreatureDeleteSuccess}
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
      <MainLayout>
        <div className="flex w-full h-full overflow-hidden">
          <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
            <CreatureListPanel
              onSelectCreature={handleSelectCreature}
              onNewCreature={handleNewCreature}
              selectedCreatureId={selectedCreatureId}
              dataVersion={dataVersion}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 w-full">
              <CreatureEditorPanel
                key={selectedCreatureId ?? (isCreatingNew ? 'new' : 'placeholder')}
                creatureId={selectedCreatureId}
                isCreatingNew={isCreatingNew}
                template={templateData}
                onCreatureSaveSuccess={onCreatureSaveSuccess}
                onCreatureDeleteSuccess={onCreatureDeleteSuccess}
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
