
"use client";

import { useState, useMemo, useEffect } from "react";
import type { Combatant, PlayerCombatant, MonsterCombatant } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { ChevronUp, ChevronDown, User, Bot, UserPlus, HeartPulse } from "lucide-react";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { cn } from "@/lib/utils";


interface InitiativeTrackerProps {
  combatantsInTurnOrder: (Combatant & { turnId: string })[];
  defeatedCombatants: MonsterCombatant[];
  selectedCombatantId: string | null;
  onSelectCombatant: (id: string | null) => void;
  round: number;
  onNextRound: () => void;
  onPrevRound: () => void;
  onCombatantUpdate: (combatant: Combatant) => void;
  onRevive: (combatantId: string) => void;
  perilRoll: number;
  perilText: string;
  onAddPlayer?: (name: string) => void;
}

export default function InitiativeTracker({
  combatantsInTurnOrder,
  defeatedCombatants,
  selectedCombatantId,
  onSelectCombatant,
  round,
  onNextRound,
  onPrevRound,
  onCombatantUpdate,
  onRevive,
  perilRoll,
  perilText,
  onAddPlayer,
}: InitiativeTrackerProps) {
  const [localInitiatives, setLocalInitiatives] = useState<Record<string, string>>({});
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);

  const allPlayers = useMemo(() => 
    combatantsInTurnOrder.filter(c => c.type === 'player') as PlayerCombatant[],
    [combatantsInTurnOrder]
  );
  
  useEffect(() => {
    const newInits: Record<string, string> = {};
    allPlayers.forEach(p => {
        if(p.initiative !== undefined && p.initiative !== null) {
          newInits[p.id] = p.initiative > 0 ? String(p.initiative) : '';
        }
    });
    setLocalInitiatives(newInits);
  }, [allPlayers, round]); 


  const handleInitiativeChange = (playerId: string, value: string) => {
    setLocalInitiatives(prev => ({ ...prev, [playerId]: value }));
  };
  
  const handleInitiativeBlur = (playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;
    const newInitiative = parseInt(localInitiatives[playerId], 10) || 0;
    if (player && (player.initiative === undefined || player.initiative !== newInitiative)) {
      onCombatantUpdate({ ...player, initiative: newInitiative });
    }
  };

  const handleNat20Change = (combatant: PlayerCombatant, checked: boolean) => {
    onCombatantUpdate({ ...combatant, nat20: checked });
  };
  
  const handleAddPlayer = () => {
    if (onAddPlayer && newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName("");
      setIsAddPlayerDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-card">
      <div className="flex justify-between items-center mb-4">
        <div className="text-center">
            <p className="text-sm text-muted-foreground">Round</p>
            <p className="text-4xl font-bold">{round}</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={onPrevRound} variant="outline" size="icon" disabled={round === 1}>
                <ChevronUp className="h-4 w-4"/>
                <span className="sr-only">Previous Round</span>
            </Button>
            <Button onClick={onNextRound} variant="default" size="icon">
                <ChevronDown className="h-4 w-4"/>
                <span className="sr-only">Next Round</span>
            </Button>
        </div>
        <div className="text-center">
            <p className="text-sm text-muted-foreground">Peril</p>
            <p className="text-4xl font-bold">{perilRoll}</p>
        </div>
      </div>
      <p className="text-center text-sm font-semibold text-muted-foreground -mt-2 mb-4">{perilText}</p>

      <Separator className="my-2" />

      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-foreground">Initiative Order</h3>
        {onAddPlayer && (
          <Dialog open={isAddPlayerDialogOpen} onOpenChange={setIsAddPlayerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" /> Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="col-span-3"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPlayer();
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPlayer}>Add Player</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <ScrollArea className="flex-1">
        {combatantsInTurnOrder.length > 0 ? (
          <ul className="space-y-2 pr-4">
            {combatantsInTurnOrder.map((c) => (
              <li key={c.turnId}>
                <button
                    onClick={() => onSelectCombatant(c.id)}
                    className={cn(
                        "w-full text-left p-3 rounded-lg border-l-4 transition-all",
                        selectedCombatantId === c.id
                        ? "bg-primary/20 border-primary shadow-md"
                        : "bg-background border-transparent hover:bg-muted"
                    )}
                >
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {c.type === "player" ? (
                        <User className="h-5 w-5 text-accent" />
                        ) : (
                        <Bot className="h-5 w-5 text-accent" />
                        )}
                        <span className="font-semibold">{c.name}</span>
                    </div>
                    {c.type === 'player' ? (
                        <Input 
                        type="number"
                        value={localInitiatives[c.id] || ''}
                        onChange={(e) => handleInitiativeChange(c.id, e.target.value)}
                        onBlur={() => handleInitiativeBlur(c.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 h-8"
                        min="0"
                        />
                    ) : (
                        <span className="font-bold text-lg">{c.initiative}</span>
                    )}
                    </div>
                    {c.type === 'player' && (
                    <div className="flex items-center gap-2 mt-2 pl-8" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            id={`nat20-${c.id}`}
                            checked={c.nat20}
                            onCheckedChange={(checked) => handleNat20Change(c, !!checked)}
                        />
                        <Label htmlFor={`nat20-${c.id}`}>Nat 20</Label>
                    </div>
                    )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center pt-4">Waiting for players...</p>
        )}
      </ScrollArea>
      {defeatedCombatants.length > 0 && (
          <>
            <Separator className="my-2" />
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  Defeated ({defeatedCombatants.length})
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                 <ScrollArea className="flex-1">
                  <ul className="space-y-2 pr-4 pt-2">
                    {defeatedCombatants.map((c) => (
                      <li key={c.id} className="p-3 rounded-lg bg-destructive/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Bot className="h-5 w-5 text-destructive/80" />
                            <span className="font-semibold text-destructive/80 line-through">{c.name}</span>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => onRevive(c.id)}>
                            <HeartPulse className="h-4 w-4 mr-2" /> Revive
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                 </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </>
      )}
    </div>
  );
}
