
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
import CitiesPage from '@/app/cities/page';
import type { CustomDate } from '@/lib/types';

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
  'cities': CitiesPage,
};

export default function AppRouter() {
  const { worldSlug } = useWorld();
  const [page, setPage] = useState<{ Component: React.ComponentType<any> | null; props: any }>({ Component: null, props: {} });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const [path, queryString] = hash.split('?');
      const parts = path.split('/').filter(Boolean);
      const currentWorldSlug = parts[0];
      const pageKey = parts.slice(1, parts[1]?.startsWith('random') ? 3 : 2).join('/');
      const selectedId = parts.length > (pageKey.startsWith('random') ? 3 : 2) ? parts[parts.length -1] : undefined;

      let extraProps: Record<string, any> = { selectedId };

      if (queryString) {
        const params = new URLSearchParams(queryString);
        params.forEach((value, key) => {
          if (key === 'selectedDate' && value) {
            try {
              const decodedDate = JSON.parse(decodeURIComponent(value));
              if(decodedDate.year && decodedDate.monthIndex !== undefined && decodedDate.day) {
                extraProps[key] = decodedDate as CustomDate;
              }
            } catch (e) {
              console.error("Failed to parse selectedDate from URL", e);
            }
          } else {
            extraProps[key] = value;
          }
        });
      }
      
      if (currentWorldSlug === worldSlug) {
        const PageComponent = routes[pageKey] || WorldLandingPage;
        setPage({ Component: PageComponent, props: extraProps });
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [worldSlug]);
  
  if (!worldSlug) {
    return null;
  }

  const { Component, props } = page;
  return Component ? <Component {...props} /> : null;
}
