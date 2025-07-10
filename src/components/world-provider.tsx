
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setWorldDbName, getDb, WORLDS_METADATA_STORE_NAME } from '@/lib/idb';
import type { WorldMetadata } from '@/lib/types';

interface WorldContextType {
  worldSlug: string;
  worldName: string;
  refreshWorldName: () => void;
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
}

export function WorldProvider({ children }: WorldProviderProps) {
  const [worldSlug, setWorldSlug] = useState("");
  const [worldName, setWorldName] = useState("");

  const fetchWorldName = useCallback(async (slug: string) => {
    if (!slug) {
        setWorldName("");
        return;
    }
    try {
      const db = await getDb();
      const store = db.transaction(WORLDS_METADATA_STORE_NAME, 'readwrite').objectStore(WORLDS_METADATA_STORE_NAME);
      const request = store.get(slug);

      request.onsuccess = () => {
        if (request.result) {
          setWorldName(request.result.name);
        } else {
          const defaultName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const newMetadata: WorldMetadata = { slug: slug, name: defaultName, description: 'A new world of adventure awaits...' };
          store.put(newMetadata);
          setWorldName(defaultName);
        }
      };
      request.onerror = (e) => {
          console.error("Could not fetch world name", e);
          const defaultName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          setWorldName(defaultName);
      }
    } catch(e) {
      console.error("Could not fetch world name", e);
      const defaultName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setWorldName(defaultName);
    }
  }, []);
  
  const handleHashChange = useCallback(() => {
    const hash = window.location.hash.slice(1); // Remove '#'
    const parts = hash.split('/').filter(Boolean);
    const slug = parts[0] || '';
    
    if (slug) {
      setWorldDbName(slug);
      setWorldSlug(slug);
      fetchWorldName(slug);
    } else {
      setWorldDbName(''); // Reset to default or handle no-world state
      setWorldSlug('');
      setWorldName('');
    }
  }, [fetchWorldName]);

  useEffect(() => {
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [handleHashChange]);

  const refreshWorldName = useCallback(() => {
    if (worldSlug) {
      fetchWorldName(worldSlug);
    }
  }, [worldSlug, fetchWorldName]);

  const value = { worldSlug, worldName, refreshWorldName };

  return (
    <WorldContext.Provider value={value}>
      {children}
    </WorldContext.Provider>
  );
}
