
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
  const [perilHistory, setPerilHistory] = useState<Record<number, { roll: number; deeds: { heavy: number; mighty: number } }>>({});

  const rollPerilForRound = useCallback((targetRound: number) => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const roll = d1 + d2;
    
    let deeds = { heavy: 0, mighty: 0 };
    if (roll <= 6) {
      deeds = { heavy: 1, mighty: 0 };
    } else if (roll <= 9) { // 7-9
      deeds = { heavy: 1, mighty: 1 };
    } else { // 10+
      deeds = { heavy: 2, mighty: 1 };
    }

    setPerilHistory(prev => ({
      ...prev,
      [targetRound]: { roll, deeds }
    }));
  }, []);

  const { turnOrder, activeTurn } = useMemo(() => {
    const players = combatants.filter((c): c is PlayerCombatant => c.type === 'player');
    const monsters = combatants.filter((c): c is MonsterCombatant => c.type === 'monster');
    
    const sortByInitiative = (a: Combatant, b: Combatant) => b.initiative - a.initiative;
    
    const nat20Players = players.filter(p => p.nat20).sort(sortByInitiative);
    const otherPlayers = players.filter(p => !p.nat20);

    const maxMonsterInitiative = monsters.length > 0 ? Math.max(...monsters.map(m => m.initiative)) : -Infinity;
    const highInitiativePlayers = otherPlayers.filter(p => p.initiative > maxMonsterInitiative).sort(sortByInitiative);
    const lowInitiativePlayers = otherPlayers.filter(p => p.initiative <= maxMonsterInitiative).sort(sortByInitiative);
    
    const sortedMonsters = [...monsters].sort(sortByInitiative);

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
    const initialCombatants = encounter.combatants.map(c => ({ ...c }));
    setCombatants(initialCombatants);
    rollPerilForRound(1);
  }, [encounter, rollPerilForRound]);

  const nextTurn = () => {
    const newIndex = turnIndex + 1;
    if (newIndex >= turnOrder.length) {
      const newRound = round + 1;
      setRound(newRound);
      setTurnIndex(0);
      if (!perilHistory[newRound]) {
        rollPerilForRound(newRound);
      }
    } else {
      setTurnIndex(newIndex);
    }
  };

  const prevTurn = () => {
    const newIndex = turnIndex - 1;
    if (newIndex < 0) {
      if (round > 1) {
        setRound(r => r - 1);
        setTurnIndex(turnOrder.length - 1);
      }
    } else {
      setTurnIndex(newIndex);
    }
  };
  
  const currentPeril = useMemo(() => {
    return perilHistory[round] || { roll: 0, deeds: { heavy: 0, mighty: 0 } };
  }, [perilHistory, round]);

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
                    perilRoll={currentPeril.roll}
                    perilDeeds={currentPeril.deeds}
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
