
"use client";

import { useState } from 'react';
import DeedListPanel from '@/components/deed-list-panel';
import DeedEditorPanel from '@/components/deed-editor-panel';
import MainLayout from '@/components/main-layout';


export default function DeedsPage() {
  const [selectedDeedId, setSelectedDeedId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const refreshList = () => setDataVersion(v => v + 1);

  return (
    <MainLayout>
      <div className="flex flex-1 overflow-hidden h-full">
          <div className="w-[380px] border-r border-border bg-card flex-col h-full hidden md:flex">
              <DeedListPanel
                  onSelectDeed={setSelectedDeedId}
                  selectedDeedId={selectedDeedId}
                  dataVersion={dataVersion}
              />
          </div>
          <div className="flex-1 overflow-y-auto bg-background/50 p-4 sm:p-6 md:p-8 h-full">
              <DeedEditorPanel
                  key={selectedDeedId ?? 'new'}
                  deedId={selectedDeedId}
                  onDeedSaveSuccess={(id) => {
                      refreshList();
                      setSelectedDeedId(id);
                  }}
                  onDeedDeleteSuccess={() => {
                      refreshList();
                      setSelectedDeedId(null);
                  }}
                  clearSelection={() => setSelectedDeedId(null)}
              />
          </div>
      </div>
    </MainLayout>
  );
}
