
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Encounter, Combatant, MonsterCombatant } from "@/lib/types";
import InitiativeTracker from "./initiative-tracker";
import CombatantDashboard from "./combatant-dashboard";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Swords } from "lucide-react";

interface LiveEncounterViewProps {
  encounter: Encounter;
  onEndEncounter: () => void;
}

export default function LiveEncounterView({ encounter, onEndEncounter }: LiveEncounterViewProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [round, setRound] = useState(1);

  const sortedCombatants = useMemo(() => {
    const monsters = combatants.filter(c => c.type === 'monster');
    const players = combatants.filter(c => c.type === 'player');
    
    const maxMonsterInitiative = monsters.length > 0 ? Math.max(...monsters.map(m => m.initiative)) : -Infinity;

    const highInitiativePlayers = players.filter(p => p.initiative > maxMonsterInitiative);
    const lowInitiativePlayers = players.filter(p => p.initiative <= maxMonsterInitiative);
    
    const sortedMonsters = [...monsters].sort((a, b) => b.initiative - a.initiative);
    const sortedHighPlayers = [...highInitiativePlayers].sort((a,b) => b.initiative - a.initiative);
    const sortedLowPlayers = [...lowInitiativePlayers].sort((a,b) => b.initiative - a.initiative);

    return [...sortedHighPlayers, ...sortedMonsters, ...sortedLowPlayers];
  }, [combatants]);

  useEffect(() => {
    // Initialize combatants with current HP set to max HP for monsters
    const initialCombatants = encounter.combatants.map(c => {
      if (c.type === 'monster') {
        return { ...c, currentHp: c.maxHp };
      }
      return c;
    });
    setCombatants(initialCombatants);
  }, [encounter]);
  
  const activeCombatant = useMemo(() => sortedCombatants[turnIndex], [sortedCombatants, turnIndex]);

  const nextTurn = useCallback(() => {
    setTurnIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      if (newIndex >= sortedCombatants.length) {
        setRound(r => r + 1);
        return 0;
      }
      return newIndex;
    });
  }, [sortedCombatants.length]);

  const prevTurn = useCallback(() => {
    setTurnIndex(prevIndex => {
      const newIndex = prevIndex - 1;
      if (newIndex < 0) {
        if (round > 1) {
          setRound(r => r - 1);
          return sortedCombatants.length - 1;
        }
        return 0; // Can't go back before round 1, turn 0
      }
      return newIndex;
    });
  }, [round, sortedCombatants.length]);

  const updateCombatant = (updatedCombatant: Combatant) => {
    setCombatants(prevCombatants => 
      prevCombatants.map(c => c.id === updatedCombatant.id ? updatedCombatant : c)
    );
  };
  
  return (
    <SidebarProvider>
      <div className="flex flex-col h-full w-full">
         <header className="py-4 px-6 md:px-8 border-b border-border flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <Swords className="text-primary h-8 w-8" />
                <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary-foreground">{encounter.name}</h1>
              </div>
            </div>
            <Button variant="destructive" onClick={onEndEncounter}>End Encounter</Button>
         </header>
         <main className="flex-1 overflow-hidden">
            <div className="flex w-full h-full overflow-hidden">
              <Sidebar style={{ "--sidebar-width": "300px" } as React.CSSProperties}>
                 <InitiativeTracker 
                    combatants={sortedCombatants}
                    activeCombatantId={activeCombatant?.id}
                    round={round}
                    onNextTurn={nextTurn}
                    onPrevTurn={prevTurn}
                    onCombatantUpdate={updateCombatant}
                 />
              </Sidebar>
              <SidebarInset className="flex-1 overflow-y-auto">
                 {activeCombatant && (
                   <CombatantDashboard
                      key={activeCombatant.id} 
                      combatant={activeCombatant}
                      onUpdate={updateCombatant}
                   />
                 )}
              </SidebarInset>
            </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
