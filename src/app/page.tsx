"use client";

import { useState } from "react";
import CreatureListPanel from "@/components/monster-list-panel";
import CreatureEditorPanel from "@/components/monster-editor-panel";
import { Skull } from "lucide-react";

export default function Home() {
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(true);

  const handleSelectCreature = (id: string) => {
    setSelectedCreatureId(id);
    setIsCreatingNew(false);
  };

  const handleNewCreature = () => {
    setSelectedCreatureId(null);
    setIsCreatingNew(true);
  };

  const handleCreatureCreated = (id: string) => {
    setSelectedCreatureId(id);
    setIsCreatingNew(false);
  }

  const handleCreatureDeleted = () => {
    setSelectedCreatureId(null);
    setIsCreatingNew(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <header className="py-4 px-6 md:px-8 border-b border-border flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Skull className="text-primary h-8 w-8" />
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary-foreground">Tresspasser Bestiary</h1>
        </div>
      </header>
      <main className="grid md:grid-cols-[380px_1fr] min-h-[calc(100vh-81px)]">
        <CreatureListPanel
          onSelectCreature={handleSelectCreature}
          onNewCreature={handleNewCreature}
          selectedCreatureId={selectedCreatureId}
        />
        <div className="bg-background/50 p-4 sm:p-6 md:p-8">
          <CreatureEditorPanel
            key={selectedCreatureId ?? 'new'} 
            creatureId={selectedCreatureId}
            isCreatingNew={isCreatingNew}
            onCreatureCreated={handleCreatureCreated}
            onCreatureDeleted={handleCreatureDeleted}
          />
        </div>
      </main>
    </div>
  );
}
