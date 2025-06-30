
"use client";

import { useState } from 'react';
import MainLayout from "@/components/main-layout";
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import EncounterListPanel from '@/components/encounter-list-panel';
import EncounterEditorPanel from '@/components/encounter-editor-panel';
import LiveEncounterView from '@/components/live-encounter-view';
import type { Encounter } from '@/lib/types';
import { getEncounterById } from '@/lib/idb';
import { useToast } from '@/hooks/use-toast';

type EncounterViewMode = 'preparation' | 'live';

export default function EncountersPage() {
  const [mode, setMode] = useState<EncounterViewMode>('preparation');
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [liveEncounter, setLiveEncounter] = useState<Encounter | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState(0);
  const { toast } = useToast();

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectEncounter = (id: string | null) => {
    setSelectedEncounterId(id);
    setIsCreatingNew(false);
  };

  const handleNewEncounter = () => {
    setSelectedEncounterId(null);
    setIsCreatingNew(true);
  };

  const onEncounterSaveSuccess = (id: string) => {
    refreshList();
    setSelectedEncounterId(id);
    setIsCreatingNew(false);
  };

  const onEncounterDeleteSuccess = () => {
    refreshList();
    setSelectedEncounterId(null);
    setIsCreatingNew(false);
  };

  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedEncounterId(null);
    }
  };

  const handleRunEncounter = async (id: string) => {
    try {
      const encounterData = await getEncounterById(id);
      if (encounterData) {
        setLiveEncounter(encounterData);
        setMode('live');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find encounter to run.' });
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to load encounter data.' });
    }
  };

  const handleEndEncounter = () => {
    setLiveEncounter(null);
    setMode('preparation');
  };

  if (mode === 'live' && liveEncounter) {
    return (
      <MainLayout>
        <LiveEncounterView
          encounter={liveEncounter}
          onEndEncounter={handleEndEncounter}
        />
      </MainLayout>
    );
  }

  return (
    <SidebarProvider>
      <MainLayout>
        <div className="flex w-full h-full overflow-hidden">
          <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
            <EncounterListPanel
              onSelectEncounter={handleSelectEncounter}
              onNewEncounter={handleNewEncounter}
              selectedEncounterId={selectedEncounterId}
              dataVersion={dataVersion}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 h-full w-full">
              <EncounterEditorPanel
                key={selectedEncounterId ?? (isCreatingNew ? 'new' : 'placeholder')}
                encounterId={selectedEncounterId}
                isCreatingNew={isCreatingNew}
                onEncounterSaveSuccess={onEncounterSaveSuccess}
                onEncounterDeleteSuccess={onEncounterDeleteSuccess}
                onEditCancel={onEditCancel}
                dataVersion={dataVersion}
                onRunEncounter={handleRunEncounter}
              />
            </div>
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}
