
"use client";

import { useState } from "react";
import type { CreatureWithDeeds } from "@/lib/types";
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
    setMinLevel,
    setMaxLevel,
    setMinTR,
    setMaxTR,
    setTagFilter,
    setSortBy,
    setSortOrder
  };

  const handleFilterByClick = (updates: Partial<typeof filters>) => {
    if (updates.roleFilter) setRoleFilter(updates.roleFilter);
    if (updates.minLevel) setMinLevel(String(updates.minLevel));
    if (updates.maxLevel) setMaxLevel(String(updates.maxLevel));
    if (updates.minTR) setMinTR(String(updates.minTR));
    if (updates.maxTR) setMaxTR(String(updates.maxTR));
    if (updates.tagFilter) setTagFilter(updates.tagFilter);
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
              onImportSuccess={refreshList}
              filters={filters}
              setFilters={setFilters}
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
