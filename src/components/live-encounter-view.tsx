
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Encounter, Combatant, MonsterCombatant, PlayerCombatant, Creature, Deed } from "@/lib/types";
import { getCreaturesByIds, getDeedsByIds } from "@/lib/idb";
import InitiativeTracker from "./initiative-tracker";
import CombatantDashboard from "./combatant-dashboard";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Swords } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface LiveEncounterViewProps {
  encounter: Encounter;
  onEndEncounter: () => void;
}

export default function LiveEncounterView({ encounter, onEndEncounter }: LiveEncounterViewProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [loading, setLoading] = useState(true);
  const [turnIndex, setTurnIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [perilHistory, setPerilHistory] = useState<Record<number, { roll: number; deeds: { heavy: number; mighty: number } }>>({});

  const rollPerilForRound = useCallback((targetRound: number) => {
    setPerilHistory(prev => {
        if (prev[targetRound]) return prev;

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const roll = d1 + d2;
        
        let deeds = { heavy: 0, mighty: 0 };
        if (roll <= 6) {
        deeds = { heavy: 1, mighty: 0 };
        } else if (roll >= 7 && roll <= 9) {
        deeds = { heavy: 1, mighty: 1 };
        } else { // 10+
        deeds = { heavy: 2, mighty: 1 };
        }
        
        const newHistory = { ...prev };
        newHistory[targetRound] = { roll, deeds };
        return newHistory;
    });
  }, []);
  
  const allPlayersReady = useMemo(() => {
    if (loading) return false;
    const players = combatants.filter((c): c is PlayerCombatant => c.type === 'player');
    if (players.length === 0) return true; // No players means ready to go
    return players.every(p => p.initiative > 0 || p.nat20);
  }, [combatants, loading]);

  const { turnOrder, activeTurn, untrackedPlayers } = useMemo(() => {
    if (loading || combatants.length === 0) return { turnOrder: [], activeTurn: null, untrackedPlayers: [] };

    const allPlayers = combatants.filter((c): c is PlayerCombatant => c.type === 'player');
    const monsters = combatants.filter((c): c is MonsterCombatant => c.type === 'monster');
    
    const untracked = allPlayers.filter(p => p.initiative === 0 && !p.nat20);
    const trackedPlayers = allPlayers.filter(p => p.initiative > 0 || p.nat20);

    const sortByInitiative = (a: Combatant, b: Combatant) => b.initiative - a.initiative;
    
    const nat20Players = trackedPlayers.filter(p => p.nat20).sort(sortByInitiative);
    const otherPlayers = trackedPlayers.filter(p => !p.nat20);

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
    
    const currentActiveTurn = allPlayersReady ? finalTurnOrder[turnIndex] : null;

    return { turnOrder: finalTurnOrder, activeTurn: currentActiveTurn, untrackedPlayers: untracked };
  }, [combatants, turnIndex, loading, allPlayersReady]);

  useEffect(() => {
    const initializeCombatants = async () => {
        setLoading(true);
        const monsterIds = encounter.monsterGroups.map(g => g.monsterId);
        const creaturesData = await getCreaturesByIds(monsterIds);
        const creaturesMap = new Map(creaturesData.map(c => [c.id, c]));

        const allDeedIds = creaturesData.flatMap(c => c.deeds);
        const deedsData = await getDeedsByIds(allDeedIds);
        const deedsMap = new Map(deedsData.map(d => [d.id, d]));

        const newCombatants: Combatant[] = [];
        
        // Players
        (encounter.players || []).forEach(p => {
            newCombatants.push({
                id: p.id,
                type: 'player',
                name: p.name,
                initiative: 0,
                nat20: false,
            });
        });

        // Monsters
        (encounter.monsterGroups || []).forEach(group => {
            const creature = creaturesMap.get(group.monsterId);
            if (!creature) return;

            const monsterDeeds = creature.deeds.map(deedId => deedsMap.get(deedId)).filter(Boolean) as Deed[];

            for (let i = 0; i < group.quantity; i++) {
                const instance: MonsterCombatant = {
                    id: crypto.randomUUID(),
                    type: 'monster',
                    name: group.quantity > 1 ? `${creature.name} ${i + 1}` : creature.name,
                    monsterId: creature.id,
                    level: creature.level,
                    role: creature.role,
                    TR: creature.TR,
                    initiative: creature.attributes.Initiative,
                    maxHp: creature.attributes.HP,
                    currentHp: creature.attributes.HP,
                    attributes: creature.attributes,
                    deeds: monsterDeeds,
                    abilities: creature.abilities,
                    description: creature.description,
                    tags: creature.tags,
                    states: [],
                };
                newCombatants.push(instance);
            }
        });

        setCombatants(newCombatants);
        rollPerilForRound(1);
        setLoading(false);
    };

    initializeCombatants();
  }, [encounter, rollPerilForRound]);

  const nextTurn = () => {
    if (!allPlayersReady) return;
    setTurnIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        if (newIndex >= turnOrder.length) {
            const newRound = round + 1;
            setRound(newRound);
            rollPerilForRound(newRound);
            // Reset player initiatives for the new round
            setCombatants(prev => prev.map(c => 
                c.type === 'player' ? { ...c, initiative: 0, nat20: false } : c
            ));
            return 0; // Reset turn index
        }
        return newIndex;
    });
  };

  const prevTurn = () => {
    if (!allPlayersReady) return;
    setTurnIndex(prevIndex => {
      if (prevIndex === 0 && round === 1) return 0; // Can't go back from turn 1, round 1

      const newIndex = prevIndex - 1;
      if (newIndex < 0) {
        const newRound = round - 1;
        setRound(newRound);
        // This is imperfect if turn order changes between rounds, but it's a reasonable approximation
        return turnOrder.length > 0 ? turnOrder.length - 1 : 0;
      }
      return newIndex;
    });
  };
  
  const currentPeril = useMemo(() => {
    return perilHistory[round] || { roll: 0, deeds: { heavy: 0, mighty: 0 } };
  }, [perilHistory, round]);

  const updateCombatant = (updatedCombatant: Combatant) => {
    setCombatants(prevCombatants => 
      prevCombatants.map(c => {
        // This is a bit tricky since PlayerCombatant and MonsterCombatant have different shapes.
        // We'll update based on ID and type.
        if (c.id === updatedCombatant.id) {
           return updatedCombatant;
        }
        return c;
      })
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
         <main className="flex-1 flex min-h-0">
            <Sidebar style={{ "--sidebar-width": "300px" } as React.CSSProperties}>
                {loading ? <Skeleton className="h-full w-full" /> : (
                  <InitiativeTracker 
                      combatantsInTurnOrder={turnOrder}
                      untrackedPlayers={untrackedPlayers}
                      activeTurnId={activeTurn?.turnId}
                      round={round}
                      onNextTurn={nextTurn}
                      onPrevTurn={prevTurn}
                      onCombatantUpdate={updateCombatant}
                      perilRoll={currentPeril.roll}
                      perilDeeds={currentPeril.deeds}
                      allPlayersReady={allPlayersReady}
                  />
                )}
            </Sidebar>
            <SidebarInset className="flex-1 overflow-y-auto bg-background/50">
                {loading ? <Skeleton className="h-full w-full p-8" /> : activeTurn ? (
                  <CombatantDashboard
                      key={activeTurn.turnId} 
                      combatant={activeTurn}
                      onUpdate={updateCombatant}
                  />
                ) : (
                  <div className="p-8 text-center text-muted-foreground">Encounter loaded. Set player initiatives and press "Next" to begin.</div>
                )}
            </SidebarInset>
        </main>
      </div>
    </SidebarProvider>
  );
}
