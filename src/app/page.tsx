
"use client";

import { useState } from "react";
import type { CreatureWithDeeds, Role, CreatureTemplate } from "@/lib/types";
import CreatureListPanel from "@/components/monster-list-panel";
import CreatureEditorPanel from "@/components/monster-editor-panel";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import MainLayout from "@/components/main-layout";

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
  };

  const handleNewCreature = () => {
    setSelectedCreatureId(null);
    setIsCreatingNew(true);
    setTemplateData(null);
  };

  const handleUseAsTemplate = (creatureData: CreatureWithDeeds) => {
    const template = { ...creatureData };
    template.name = `Copy of ${creatureData.name || 'creature'}`;
    delete template.id;

    setSelectedCreatureId(null);
    setIsCreatingNew(true);
    setTemplateData(template);
  };

  const onCreatureSaveSuccess = (id: string) => {
    refreshList();
    setSelectedCreatureId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
  };

  const onCreatureDeleteSuccess = () => {
    refreshList();
    setSelectedCreatureId(null);
    setIsCreatingNew(false); 
    setTemplateData(null);
  };
  
  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedCreatureId(null);
    }
  };

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
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 h-full w-full">
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
