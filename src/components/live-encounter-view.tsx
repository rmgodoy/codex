
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Encounter, Combatant, MonsterCombatant, PlayerCombatant, Creature, Deed, MonsterEncounterGroup } from "@/lib/types";
import { getCreaturesByIds, getDeedsByIds, getEncounterTableById } from "@/lib/idb";
import InitiativeTracker from "./initiative-tracker";
import CombatantDashboard from "./combatant-dashboard";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Swords } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface LiveEncounterViewProps {
  encounter: Encounter;
  onEndEncounter: () => void;
}

type PerilState = { roll: number; text: string };

const rollQuantity = (quantityStr: string): number => {
    if (!quantityStr) return 1;
    const q = quantityStr.toLowerCase().trim();

    const diceMatch = q.match(/(\d*)d(\d+)/);
    if (diceMatch) {
        const numDice = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1;
        const dieSize = parseInt(diceMatch[2], 10);
        if (!isNaN(numDice) && !isNaN(dieSize) && dieSize > 0) {
            let total = 0;
            for (let i = 0; i < numDice; i++) {
                total += Math.floor(Math.random() * dieSize) + 1;
            }
            return total;
        }
    }

    const fixedQty = parseInt(q, 10);
    if (!isNaN(fixedQty) && fixedQty > 0) {
        return fixedQty;
    }

    return 1;
};

export default function LiveEncounterView({ encounter, onEndEncounter }: LiveEncounterViewProps) {
  const [combatantsByRound, setCombatantsByRound] = useState<Record<number, Combatant[]>>({});
  const [loading, setLoading] = useState(true);
  const [turnIndex, setTurnIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [perilHistory, setPerilHistory] = useState<Record<number, PerilState>>({});
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const combatants = useMemo(() => combatantsByRound[round] || [], [combatantsByRound, round]);

  const addPlayer = useCallback((name: string) => {
    if (!name) return;

    setCombatantsByRound(prevRounds => {
      const newPlayer: PlayerCombatant = {
        id: crypto.randomUUID(),
        type: 'player',
        name: name,
        initiative: 0,
        nat20: false,
      };

      const updatedRounds = { ...prevRounds };

      if (!updatedRounds[round]) {
        updatedRounds[round] = [];
      }

      for (const roundKey in updatedRounds) {
        if (parseInt(roundKey) >= round) {
          updatedRounds[roundKey] = [...updatedRounds[roundKey], newPlayer];
        }
      }

      return updatedRounds;
    });
  }, [round]);

  const rollPerilForRound = useCallback((targetRound: number, currentCombatants: Combatant[]) => {
    setPerilHistory(prev => {
        if (prev[targetRound]) return prev;

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const roll = d1 + d2;
        
        let text = "";
        const isTyrantEncounter = currentCombatants.some(c => c.type === 'monster' && c.template === 'Tyrant');
        
        if (isTyrantEncounter) {
            if (roll <= 6) {
                text = '1 Heavy, 1 Light deed';
            } else if (roll <= 9) {
                text = '1 Mighty & 1 Light, or 2 Heavy deeds';
            } else { // 10+
                text = '1 Mighty, 1 Heavy deed';
            }
        } else {
            if (roll <= 6) {
                text = '1 Heavy deed';
            } else if (roll <= 9) {
                text = '1 Heavy, 1 Mighty deed';
            } else { // 10+
                text = '2 Heavy, 1 Mighty deed';
            }
        }
        
        const newHistory = { ...prev };
        newHistory[targetRound] = { roll, text };
        return newHistory;
    });
  }, []);
  
  const allPlayersReady = useMemo(() => {
    if (loading || combatants.length === 0) return false;
    const players = combatants.filter((c): c is PlayerCombatant => c.type === 'player');
    if (players.length === 0) return true;
    return players.every(p => (p.initiative !== undefined && p.initiative > 0) || p.nat20);
  }, [combatants, loading]);

  const { turnOrder, activeTurn, untrackedPlayers } = useMemo(() => {
    if (loading || combatants.length === 0) return { turnOrder: [], activeTurn: null, untrackedPlayers: [] };

    const allPlayers = combatants.filter((c): c is PlayerCombatant => c.type === 'player');
    const monsters = combatants.filter((c): c is MonsterCombatant => c.type === 'monster');
    
    const untracked = allPlayers.filter(p => (p.initiative === undefined || p.initiative <= 0) && !p.nat20);
    const trackedPlayers = allPlayers.filter(p => (p.initiative !== undefined && p.initiative > 0) || p.nat20);

    const sortByInitiative = (a: Combatant, b: Combatant) => (b.initiative || 0) - (a.initiative || 0);
    
    const nat20Players = trackedPlayers.filter(p => p.nat20).sort(sortByInitiative);
    const otherPlayers = trackedPlayers.filter(p => !p.nat20);

    const maxMonsterInitiative = monsters.length > 0 ? Math.max(...monsters.map(m => m.initiative)) : -Infinity;
    const highInitiativePlayers = otherPlayers.filter(p => (p.initiative || 0) > maxMonsterInitiative).sort(sortByInitiative);
    const lowInitiativePlayers = otherPlayers.filter(p => (p.initiative || 0) <= maxMonsterInitiative).sort(sortByInitiative);
    
    const sortedMonsters = [...monsters].sort(sortByInitiative);
    const paragonsAndTyrants = monsters.filter(m => m.template === 'Paragon' || m.template === 'Tyrant').sort(sortByInitiative);

    const finalTurnOrder = [
      ...nat20Players.map(c => ({ ...c, turnId: `${c.id}-start` })),
      ...highInitiativePlayers.map(c => ({ ...c, turnId: c.id })),
      ...sortedMonsters.map(c => ({ ...c, turnId: c.id })),
      ...lowInitiativePlayers.map(c => ({ ...c, turnId: c.id })),
      ...nat20Players.map(c => ({ ...c, turnId: `${c.id}-end` })),
      ...paragonsAndTyrants.map(c => ({ ...c, turnId: `${c.id}-extra` })),
    ];
    
    const currentActiveTurn = allPlayersReady ? finalTurnOrder[turnIndex] : null;

    return { turnOrder: finalTurnOrder, activeTurn: currentActiveTurn, untrackedPlayers: untracked };
  }, [combatants, turnIndex, loading, allPlayersReady]);

  useEffect(() => {
    const initializeCombatants = async () => {
        setLoading(true);

        let monsterGroups: MonsterEncounterGroup[] = encounter.monsterGroups;

        if (encounter.encounterTableId) {
            const table = await getEncounterTableById(encounter.encounterTableId);
            if (!table || table.entries.length === 0) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find encounter table or it is empty.' });
                onEndEncounter();
                return;
            }

            const totalWeight = table.entries.reduce((sum, entry) => sum + entry.weight, 0);
            if (totalWeight <= 0) {
              toast({ variant: 'destructive', title: 'Error', description: 'Encounter table has no weight.' });
              onEndEncounter();
              return;
            }
            let random = Math.random() * totalWeight;
            let chosenEntry = table.entries[0];
            for (const entry of table.entries) {
                random -= entry.weight;
                if (random <= 0) {
                    chosenEntry = entry;
                    break;
                }
            }
            
            const quantity = rollQuantity(chosenEntry.quantity || '1');
            
            monsterGroups = [{ monsterId: chosenEntry.creatureId, quantity }];
        }

        const monsterIds = monsterGroups.map(g => g.monsterId);
        const creaturesData = await getCreaturesByIds(monsterIds);
        const creaturesMap = new Map(creaturesData.map(c => [c.id, c]));

        const allDeedIds = creaturesData.flatMap(c => c.deeds);
        const deedsData = await getDeedsByIds(allDeedIds);
        const deedsMap = new Map(deedsData.map(d => [d.id, d]));

        const initialCombatants: Combatant[] = [];
        
        (encounter.players || []).forEach(p => {
            initialCombatants.push({
                id: p.id,
                type: 'player',
                name: p.name,
                initiative: 0,
                nat20: false,
            });
        });

        (monsterGroups || []).forEach(group => {
            const creature = creaturesMap.get(group.monsterId);
            if (!creature) return;
            
            let monsterDeeds = creature.deeds.map(deedId => deedsMap.get(deedId)).filter(Boolean) as Deed[];
            if (creature.template === 'Underling') {
              monsterDeeds = monsterDeeds.filter(d => d.tier === 'light');
            }

            for (let i = 0; i < group.quantity; i++) {
                const instance: MonsterCombatant = {
                    id: crypto.randomUUID(),
                    type: 'monster',
                    name: group.quantity > 1 ? `${creature.name} ${i + 1}` : creature.name,
                    monsterId: creature.id,
                    level: creature.level,
                    role: creature.role,
                    template: creature.template || 'Normal',
                    TR: creature.TR,
                    initiative: creature.attributes.Initiative,
                    maxHp: creature.template === 'Underling' ? 1 : creature.attributes.HP,
                    currentHp: creature.template === 'Underling' ? 1 : creature.attributes.HP,
                    attributes: creature.attributes,
                    deeds: monsterDeeds,
                    abilities: creature.abilities,
                    description: creature.description,
                    tags: creature.tags,
                    states: [],
                };
                initialCombatants.push(instance);
            }
        });

        setCombatantsByRound({ 1: initialCombatants });
        rollPerilForRound(1, initialCombatants);
        setLoading(false);
    };

    initializeCombatants();
  }, [encounter, rollPerilForRound, onEndEncounter, toast]);
  
  const nextTurn = () => {
    if (!allPlayersReady) return;

    const isLastTurnOfRound = turnIndex + 1 >= turnOrder.length;

    if (isLastTurnOfRound) {
        // End of round, start new one
        const newRound = round + 1;
        
        // If the state for the next round doesn't exist yet, create it.
        if (!combatantsByRound[newRound]) {
            const newCombatantsForRound: Combatant[] = JSON.parse(JSON.stringify(combatants));
            
            // Reset initiative and nat20 for all players for the new round.
            newCombatantsForRound.forEach((c: Combatant) => {
                if (c.type === 'player') {
                    c.initiative = 0;
                    c.nat20 = false;
                }
            });
    
            setCombatantsByRound(prev => ({ ...prev, [newRound]: newCombatantsForRound }));
            rollPerilForRound(newRound, newCombatantsForRound);
        }

        setRound(newRound);
        setTurnIndex(0);
    } else {
        setTurnIndex(prevIndex => prevIndex + 1);
    }
  };

  const prevTurn = () => {
    if (turnIndex === 0 && round > 1) {
        // Go to previous round
        const newRound = round - 1;
        setRound(newRound);
        // This is complex. The turn order length of previous round is needed.
        // A simpler approach is to just set turn index to the end of the previous round.
        // For now, let's just go to the start of the previous round. A full back-step is tricky.
        setTurnIndex(0); // Simplification: go to start of prev round.
    } else if (turnIndex > 0) {
        setTurnIndex(prevIndex => prevIndex - 1);
    }
  };
  
  const currentPeril = useMemo(() => {
    return perilHistory[round] || { roll: 0, text: "" };
  }, [perilHistory, round]);

  const updateCombatant = useCallback((updatedCombatant: Combatant) => {
    setCombatantsByRound(prevRounds => {
      if (!prevRounds[round]) return prevRounds;
      const newCombatants = (prevRounds[round] || []).map(c => 
        c.id === updatedCombatant.id ? updatedCombatant : c
      );
      
      const newState = { ...prevRounds, [round]: newCombatants };

      // Persist player initiatives across future rounds if they exist
      if (updatedCombatant.type === 'player') {
          for (let i = round + 1; i <= Math.max(...Object.keys(prevRounds).map(Number)); i++) {
              if (newState[i]) {
                  newState[i] = newState[i].map(c => {
                      if (c.id === updatedCombatant.id) {
                          return { ...c, initiative: updatedCombatant.initiative, nat20: updatedCombatant.nat20 };
                      }
                      return c;
                  });
              }
          }
      }
      return newState;
    });
  }, [round]);
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-48 w-48" />
      </div>
    );
  }
  
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen w-full">
         <header className="py-4 px-6 border-b border-border flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <Swords className="text-primary h-8 w-8" />
              <h1 className="text-xl md:text-3xl font-headline font-bold text-primary-foreground whitespace-nowrap">{encounter.name}</h1>
            </div>
            <Button variant="destructive" onClick={onEndEncounter}>End Encounter</Button>
         </header>
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <InitiativeTracker 
                combatantsInTurnOrder={turnOrder}
                untrackedPlayers={untrackedPlayers}
                activeTurnId={activeTurn?.turnId || null}
                round={round}
                onNextTurn={nextTurn}
                onPrevTurn={prevTurn}
                onCombatantUpdate={updateCombatant}
                perilRoll={currentPeril.roll}
                perilText={currentPeril.text}
                allPlayersReady={allPlayersReady}
                turnIndex={turnIndex}
                onAddPlayer={addPlayer}
            />
            {activeTurn ? (
              <CombatantDashboard
                  key={activeTurn.turnId} 
                  combatant={activeTurn}
                  onUpdate={updateCombatant}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full rounded-lg bg-card">
                <div>
                  <p className="text-xl">Encounter loaded.</p>
                  <p>Set player initiatives and press "Next" to begin.</p>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-full">
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
         <div className="flex flex-1 min-h-0">
            <Sidebar style={{ "--sidebar-width": "300px" } as React.CSSProperties}>
                {loading ? <Skeleton className="h-full w-full" /> : (
                  <InitiativeTracker 
                      combatantsInTurnOrder={turnOrder}
                      untrackedPlayers={untrackedPlayers}
                      activeTurnId={activeTurn?.turnId || null}
                      round={round}
                      onNextTurn={nextTurn}
                      onPrevTurn={prevTurn}
                      onCombatantUpdate={updateCombatant}
                      perilRoll={currentPeril.roll}
                      perilText={currentPeril.text}
                      allPlayersReady={allPlayersReady}
                      turnIndex={turnIndex}
                      onAddPlayer={addPlayer}
                  />
                )}
            </Sidebar>
            <SidebarInset className="flex-1 overflow-y-auto bg-background/50">
              <div className="p-4 sm:p-6 md:p-8 h-full">
                {activeTurn ? (
                  <CombatantDashboard
                      key={activeTurn.turnId} 
                      combatant={activeTurn}
                      onUpdate={updateCombatant}
                  />
                ) : (
                  <div className="text-center text-muted-foreground flex items-center justify-center h-full">
                    <div>
                      <p className="text-xl">Encounter loaded.</p>
                      <p>Set player initiatives and press "Next" to begin.</p>
                    </div>
                  </div>
                )}
              </div>
            </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
