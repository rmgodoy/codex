
"use client";

import { useState } from 'react';
import DeedListPanel from '@/components/deed-list-panel';
import DeedEditorPanel from '@/components/deed-editor-panel';
import MainLayout from '@/components/main-layout';
import type { Deed } from '@/lib/types';


export default function DeedsPage() {
  const [selectedDeedId, setSelectedDeedId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [templateData, setTemplateData] = useState<Partial<Deed> | null>(null);

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectDeed = (id: string | null) => {
    setSelectedDeedId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
  };

  const handleNewDeed = () => {
    setSelectedDeedId(null);
    setIsCreatingNew(true);
    setTemplateData(null);
  };

  const handleUseAsTemplate = (deedData: Deed) => {
    const template = { ...deedData };
    template.name = `Copy of ${deedData.name || 'deed'}`;
    delete template.id;

    setSelectedDeedId(null);
    setIsCreatingNew(true);
    setTemplateData(template);
  };

  const onDeedSaveSuccess = (id: string) => {
    refreshList();
    setSelectedDeedId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
  };

  const onDeedDeleteSuccess = () => {
    refreshList();
    setSelectedDeedId(null);
    setIsCreatingNew(false);
    setTemplateData(null);
  };

  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedDeedId(null);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-1 overflow-hidden h-full">
          <div className="w-[380px] border-r border-border bg-card flex-col h-full hidden md:flex">
              <DeedListPanel
                  onSelectDeed={handleSelectDeed}
                  onNewDeed={handleNewDeed}
                  selectedDeedId={selectedDeedId}
                  dataVersion={dataVersion}
              />
          </div>
          <div className="flex-1 overflow-y-auto bg-background/50 p-4 sm:p-6 md:p-8 h-full">
              <DeedEditorPanel
                  key={selectedDeedId ?? (isCreatingNew ? 'new' : 'placeholder')}
                  deedId={selectedDeedId}
                  isCreatingNew={isCreatingNew}
                  template={templateData}
                  onDeedSaveSuccess={onDeedSaveSuccess}
                  onDeedDeleteSuccess={onDeedDeleteSuccess}
                  onUseAsTemplate={handleUseAsTemplate}
                  onEditCancel={onEditCancel}
              />
          </div>
      </div>
    </MainLayout>
  );
}
