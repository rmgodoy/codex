
"use client";

import React, { useState, useEffect } from 'react';
import { useWorld } from './world-provider';

import WorldLandingPage from '@/components/world-landing-page';
import BestiaryPage from '@/app/bestiary/page';
import DeedsPage from '@/app/deeds/page';
import AlchemyPage from '@/app/alchemy/page';
import ItemsPage from '@/app/items/page';
import NpcsPage from '@/app/npcs/page';
import FactionsPage from '@/app/factions/page';
import PantheonPage from '@/app/pantheon/page';
import RoomsPage from '@/app/rooms/page';
import DungeonsPage from '@/app/dungeons/page';
import EncountersPage from '@/app/encounters/page';
import CalendarPage from '@/app/calendar/page';
import CalendarModelsPage from '@/app/custom-calendar/page';
import MapsPage from '@/app/maps/page';
import CommonersPage from '@/app/random/commoners/page';
import EncounterTablesPage from '@/app/random/encounter-tables/page';
import TreasuresPage from '@/app/random/treasures/page';

const routes: { [key: string]: React.ComponentType<any> } = {
  '': WorldLandingPage,
  'bestiary': BestiaryPage,
  'deeds': DeedsPage,
  'alchemy': AlchemyPage,
  'items': ItemsPage,
  'npcs': NpcsPage,
  'factions': FactionsPage,
  'pantheon': PantheonPage,
  'rooms': RoomsPage,
  'dungeons': DungeonsPage,
  'encounters': EncountersPage,
  'calendar': CalendarPage,
  'calendar-models': CalendarModelsPage,
  'maps': MapsPage,
  'random/commoners': CommonersPage,
  'random/encounter-tables': EncounterTablesPage,
  'random/treasures': TreasuresPage,
};

export default function AppRouter() {
  const { worldSlug } = useWorld();
  const [page, setPage] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const parts = hash.split('/').filter(Boolean);
      const currentWorldSlug = parts[0];
      const pageKey = parts.slice(1).join('/') || '';

      if (currentWorldSlug === worldSlug) {
        const PageComponent = routes[pageKey] || WorldLandingPage; 
        setPage(() => PageComponent);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [worldSlug]);
  
  if (!worldSlug) {
    return null;
  }

  const PageComponent = page;
  return PageComponent ? <PageComponent /> : null;
}
