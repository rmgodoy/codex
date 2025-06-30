
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Encounter, Combatant, MonsterCombatant, PlayerCombatant } from "@/lib/types";
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

  const { turnOrder, activeTurn } = useMemo(() => {
    const players = combatants.filter((c): c is PlayerCombatant => c.type === 'player');
    const monsters = combatants.filter((c): c is MonsterCombatant => c.type === 'monster');
    
    const sortByInitiative = (a: Combatant, b: Combatant) => b.initiative - a.initiative;
    
    // Nat 20 logic
    const nat20Players = players.filter(p => p.nat20).sort(sortByInitiative);
    const otherPlayers = players.filter(p => !p.nat20);

    // Standard player initiative groups
    const maxMonsterInitiative = monsters.length > 0 ? Math.max(...monsters.map(m => m.initiative)) : -Infinity;
    const highInitiativePlayers = otherPlayers.filter(p => p.initiative > maxMonsterInitiative).sort(sortByInitiative);
    const lowInitiativePlayers = otherPlayers.filter(p => p.initiative <= maxMonsterInitiative).sort(sortByInitiative);
    
    const sortedMonsters = [...monsters].sort(sortByInitiative);

    // Construct turn order with unique turn IDs for Nat 20 players
    const finalTurnOrder = [
      ...nat20Players.map(c => ({ ...c, turnId: `${c.id}-start` })),
      ...highInitiativePlayers.map(c => ({ ...c, turnId: c.id })),
      ...sortedMonsters.map(c => ({ ...c, turnId: c.id })),
      ...lowInitiativePlayers.map(c => ({ ...c, turnId: c.id })),
      ...nat20Players.map(c => ({ ...c, turnId: `${c.id}-end` })),
    ];
    
    const currentActiveTurn = finalTurnOrder[turnIndex];

    return { turnOrder: finalTurnOrder, activeTurn: currentActiveTurn };
  }, [combatants, turnIndex]);


  useEffect(() => {
    // Initialize combatants from encounter data
    const initialCombatants = encounter.combatants.map(c => ({ ...c }));
    setCombatants(initialCombatants);
  }, [encounter]);
  
  const nextTurn = useCallback(() => {
    setTurnIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      if (newIndex >= turnOrder.length) {
        setRound(r => r + 1);
        return 0;
      }
      return newIndex;
    });
  }, [turnOrder.length]);

  const prevTurn = useCallback(() => {
    setTurnIndex(prevIndex => {
      const newIndex = prevIndex - 1;
      if (newIndex < 0) {
        if (round > 1) {
          setRound(r => r - 1);
          return turnOrder.length - 1;
        }
        return 0; // Can't go back before round 1, turn 0
      }
      return newIndex;
    });
  }, [round, turnOrder.length]);

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
                    combatantsInTurnOrder={turnOrder}
                    activeTurnId={activeTurn?.turnId}
                    round={round}
                    onNextTurn={nextTurn}
                    onPrevTurn={prevTurn}
                    onCombatantUpdate={updateCombatant}
                 />
              </Sidebar>
              <SidebarInset className="flex-1 overflow-y-auto">
                 {activeTurn && (
                   <CombatantDashboard
                      key={activeTurn.turnId} 
                      combatant={activeTurn}
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
