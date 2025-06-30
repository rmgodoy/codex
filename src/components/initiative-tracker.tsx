
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Combatant, PlayerCombatant } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { ChevronUp, ChevronDown, User, Bot, AlertTriangle } from "lucide-react";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";


interface InitiativeTrackerProps {
  combatantsInTurnOrder: (Combatant & { turnId: string })[];
  untrackedPlayers: PlayerCombatant[];
  activeTurnId: string | null;
  round: number;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  onCombatantUpdate: (combatant: Combatant) => void;
  perilRoll: number;
  perilDeeds: { heavy: number; mighty: number };
  allPlayersReady: boolean;
  turnIndex: number;
}

export default function InitiativeTracker({
  combatantsInTurnOrder,
  untrackedPlayers,
  activeTurnId,
  round,
  onNextTurn,
  onPrevTurn,
  onCombatantUpdate,
  perilRoll,
  perilDeeds,
  allPlayersReady,
  turnIndex,
}: InitiativeTrackerProps) {
  const [localInitiatives, setLocalInitiatives] = useState<Record<string, string>>({});

  const allPlayers = useMemo(() => 
    [...untrackedPlayers, ...combatantsInTurnOrder.filter(c => c.type === 'player')] as PlayerCombatant[],
    [untrackedPlayers, combatantsInTurnOrder]
  );
  
  useEffect(() => {
    const newInits: Record<string, string> = {};
    allPlayers.forEach(p => {
        newInits[p.id] = p.initiative > 0 ? String(p.initiative) : '';
    });
    setLocalInitiatives(newInits);
  }, [allPlayers, round]); 


  const handleInitiativeChange = (playerId: string, value: string) => {
    setLocalInitiatives(prev => ({ ...prev, [playerId]: value }));
  };
  
  const handleInitiativeBlur = (playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    const newInitiative = parseInt(localInitiatives[playerId], 10) || 0;
    if (player && player.initiative !== newInitiative) {
      onCombatantUpdate({ ...player, initiative: newInitiative });
    }
  };

  const handleNat20Change = (combatant: PlayerCombatant, checked: boolean) => {
    onCombatantUpdate({ ...combatant, nat20: checked });
  };
  
  const renderNextButton = () => {
    const isDisabled = !allPlayersReady;
    const button = (
       <Button 
        onClick={onNextTurn} 
        variant="default" 
        className="w-full" 
        disabled={isDisabled}
      >
        Next <ChevronDown className="h-4 w-4 ml-2"/>
      </Button>
    );

    if (isDisabled) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">{button}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Set initiative for all players to proceed.</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return button;
  }

  return (
    <div className="flex flex-col h-full p-4 bg-card">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Round</p>
        <p className="text-4xl font-bold">{round}</p>
      </div>

      <Separator className="my-2" />
      
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Peril</p>
        <p className="text-4xl font-bold">{perilRoll}</p>
        <div className="flex justify-center gap-6 mt-2 text-sm">
          <div>
            <p className="text-muted-foreground">Heavy Deeds</p>
            <p className="font-bold text-lg">{perilDeeds.heavy}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Mighty Deeds</p>
            <p className="font-bold text-lg">{perilDeeds.mighty}</p>
          </div>
        </div>
      </div>

      <Separator className="my-2" />
      <TooltipProvider delayDuration={100}>
        <div className="flex gap-2 mb-4">
           <Button 
              onClick={onPrevTurn} 
              variant="outline" 
              className="w-full" 
              disabled={turnIndex === 0 && round === 1}
            >
              <ChevronUp className="h-4 w-4 mr-2"/> Prev
            </Button>
          {renderNextButton()}
        </div>
      </TooltipProvider>

      {untrackedPlayers.length > 0 && (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Set Initiative</h3>
            <ul className="space-y-2 pr-4">
              {untrackedPlayers.map((c) => (
                <li
                  key={c.id}
                  className="p-3 rounded-lg border-l-4 border-destructive bg-destructive/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span className="font-semibold">{c.name}</span>
                    </div>
                    <Input 
                      type="number"
                      value={localInitiatives[c.id] || ''}
                      onChange={(e) => handleInitiativeChange(c.id, e.target.value)}
                      onBlur={() => handleInitiativeBlur(c.id)}
                      className="w-20 h-8"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2 pl-8">
                    <Checkbox
                      id={`nat20-untracked-${c.id}`}
                      checked={c.nat20}
                      onCheckedChange={(checked) => handleNat20Change(c, !!checked)}
                    />
                    <Label htmlFor={`nat20-untracked-${c.id}`}>Nat 20</Label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Separator className="my-2" />
        </>
      )}

      <h3 className="text-lg font-semibold mb-2 text-primary-foreground">Initiative Order</h3>
      <ScrollArea className="flex-1">
        {combatantsInTurnOrder.length > 0 ? (
          <ul className="space-y-2 pr-4">
            {combatantsInTurnOrder.map((c) => (
              <li
                key={c.turnId}
                className={`p-3 rounded-lg border-l-4 transition-all ${
                  activeTurnId && c.turnId === activeTurnId
                    ? "bg-primary/20 border-primary shadow-md"
                    : "bg-background border-transparent"
                }`}
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
                      className="w-20 h-8"
                      min="0"
                    />
                  ) : (
                    <span className="font-bold text-lg">{c.initiative}</span>
                  )}
                </div>
                {c.type === 'player' && (
                   <div className="flex items-center gap-2 mt-2 pl-8">
                      <Checkbox
                        id={`nat20-${c.id}`}
                        checked={c.nat20}
                        onCheckedChange={(checked) => handleNat20Change(c, !!checked)}
                      />
                      <Label htmlFor={`nat20-${c.id}`}>Nat 20</Label>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center pt-4">Waiting for players...</p>
        )}
      </ScrollArea>
    </div>
  );
}
