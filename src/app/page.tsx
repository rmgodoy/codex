
"use client";

import { useState } from "react";
import type { Creature, CreatureWithDeeds } from "@/lib/types";
import CreatureListPanel from "@/components/monster-list-panel";
import CreatureEditorPanel from "@/components/monster-editor-panel";
import { Skull } from "lucide-react";
import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

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
      <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
        <CreatureListPanel
          onSelectCreature={handleSelectCreature}
          onNewCreature={handleNewCreature}
          selectedCreatureId={selectedCreatureId}
          dataVersion={dataVersion}
          onImportSuccess={refreshList}
        />
      </Sidebar>
      <SidebarInset>
        <header className="py-4 px-6 md:px-8 border-b border-border flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <Skull className="text-primary h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary-foreground">Tresspasser Bestiary</h1>
          </div>
        </header>
        <div className="bg-background/50 p-4 sm:p-6 md:p-8">
          <CreatureEditorPanel
            key={selectedCreatureId ?? (isCreatingNew ? 'new' : 'placeholder')}
            creatureId={selectedCreatureId}
            isCreatingNew={isCreatingNew}
            template={templateData}
            onCreatureSaveSuccess={onCreatureSaveSuccess}
            onCreatureDeleteSuccess={onCreatureDeleteSuccess}
            onUseAsTemplate={handleUseAsTemplate}
            onEditCancel={onEditCancel}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
