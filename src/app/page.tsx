
"use client";

import { useState } from "react";
import type { CreatureWithDeeds } from "@/lib/types";
import CreatureListPanel from "@/components/monster-list-panel";
import CreatureEditorPanel from "@/components/monster-editor-panel";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import MainLayout from "@/components/main-layout";

export default function Home() {
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [templateData, setTemplateData] = useState<Partial<CreatureWithDeeds> | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

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
              />
            </div>
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
