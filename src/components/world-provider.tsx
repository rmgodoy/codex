
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { setWorldDbName, DB_NAME, WORLDS_METADATA_STORE_NAME, getDb } from '@/lib/idb';
import { usePathname } from 'next/navigation';

interface WorldContextType {
  worldSlug: string;
  worldName: string;
}

const WorldContext = createContext<WorldContextType | null>(null);

export function useWorld(): WorldContextType {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider');
  }
  return context;
}

interface WorldProviderProps {
  children: React.ReactNode;
  worldSlug: string;
}

export default function WorldProvider({ children, worldSlug }: WorldProviderProps) {
  const [worldName, setWorldName] = useState("");
  const pathname = usePathname();
  
  useEffect(() => {
    setWorldDbName(worldSlug);
    
    const fetchWorldName = async () => {
        try {
            const db = await getDb();
            const store = db.transaction(WORLDS_METADATA_STORE_NAME, 'readonly').objectStore(WORLDS_METADATA_STORE_NAME);
            const request = store.get(worldSlug);
            request.onsuccess = () => {
                if (request.result) {
                    setWorldName(request.result.name);
                } else {
                    const defaultName = worldSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    setWorldName(defaultName);
                }
            };
        } catch(e) {
            console.error("Could not fetch world name", e);
             const defaultName = worldSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
             setWorldName(defaultName);
        }
    };
    
    fetchWorldName();

  }, [worldSlug, pathname]);

  const value = { worldSlug, worldName };

  return (
    <WorldContext.Provider value={value}>
      {children}
    </WorldContext.Provider>
  );
}

