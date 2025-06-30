"use client";

import { useState } from "react";
import MonsterListPanel from "@/components/monster-list-panel";
import MonsterEditorPanel from "@/components/monster-editor-panel";
import { Skull } from "lucide-react";

export default function Home() {
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(true);

  const handleSelectMonster = (id: string) => {
    setSelectedMonsterId(id);
    setIsCreatingNew(false);
  };

  const handleNewMonster = () => {
    setSelectedMonsterId(null);
    setIsCreatingNew(true);
  };

  const handleMonsterCreated = (id: string) => {
    setSelectedMonsterId(id);
    setIsCreatingNew(false);
  }

  const handleMonsterDeleted = () => {
    setSelectedMonsterId(null);
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
        <MonsterListPanel
          onSelectMonster={handleSelectMonster}
          onNewMonster={handleNewMonster}
          selectedMonsterId={selectedMonsterId}
        />
        <div className="bg-background/50 p-4 sm:p-6 md:p-8">
          <MonsterEditorPanel
            key={selectedMonsterId ?? 'new'} 
            monsterId={selectedMonsterId}
            isCreatingNew={isCreatingNew}
            onMonsterCreated={handleMonsterCreated}
            onMonsterDeleted={handleMonsterDeleted}
          />
        </div>
      </main>
    </div>
  );
}
