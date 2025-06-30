
"use client";

import type { Combatant, PlayerCombatant } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { ChevronUp, ChevronDown, User, Bot, AlertTriangle } from "lucide-react";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type Turn = Combatant & { turnId: string };

interface InitiativeTrackerProps {
  combatantsInTurnOrder: Turn[];
  activeTurnId: string;
  round: number;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  onCombatantUpdate: (combatant: Combatant) => void;
  perilRoll: number;
  perilDeeds: { heavy: number; mighty: number };
  allPlayersReady: boolean;
}

export default function InitiativeTracker({
  combatantsInTurnOrder,
  activeTurnId,
  round,
  onNextTurn,
  onPrevTurn,
  onCombatantUpdate,
  perilRoll,
  perilDeeds,
  allPlayersReady,
}: InitiativeTrackerProps) {
    
  const handleInitiativeChange = (combatant: Combatant, newInitiative: number) => {
    onCombatantUpdate({ ...combatant, initiative: newInitiative });
  };
  
  const handleNat20Change = (combatant: PlayerCombatant, checked: boolean) => {
    onCombatantUpdate({ ...combatant, nat20: checked });
  };

  const renderButton = (type: 'prev' | 'next') => {
    const isDisabled = !allPlayersReady;
    const button = (
       <Button 
        onClick={type === 'prev' ? onPrevTurn : onNextTurn} 
        variant={type === 'prev' ? "outline" : "default"} 
        className="w-full" 
        disabled={isDisabled}
      >
        {type === 'prev' ? <><ChevronUp className="h-4 w-4 mr-2"/> Prev</> : <>Next <ChevronDown className="h-4 w-4 ml-2"/></>}
      </Button>
    );

    if (isDisabled) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {/* The div is necessary for the tooltip to work on a disabled button */}
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
          {renderButton('prev')}
          {renderButton('next')}
        </div>
      </TooltipProvider>

      <h3 className="text-lg font-semibold mb-2 text-primary-foreground">Initiative Order</h3>
      <ScrollArea className="flex-1">
        <ul className="space-y-2 pr-4">
          {combatantsInTurnOrder.map((c) => {
            const isUntracked = c.type === 'player' && c.initiative === 0 && !c.nat20;
            return (
              <li
                key={c.turnId}
                className={`p-3 rounded-lg border-l-4 transition-all ${
                  c.turnId === activeTurnId
                    ? "bg-primary/20 border-primary shadow-md"
                    : "bg-background border-transparent"
                } ${isUntracked ? "border-destructive" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isUntracked && <AlertTriangle className="h-5 w-5 text-destructive" />}
                    {c.type === "player" && !isUntracked ? (
                      <User className="h-5 w-5 text-accent" />
                    ) : c.type === 'monster' ? (
                      <Bot className="h-5 w-5 text-accent" />
                    ) : null}
                    <span className="font-semibold">{c.name}</span>
                  </div>
                  {c.type === 'player' ? (
                    <Input 
                      type="number"
                      value={c.initiative}
                      onChange={(e) => handleInitiativeChange(c, parseInt(e.target.value, 10) || 0)}
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
          )})}
        </ul>
      </ScrollArea>
    </div>
  );
}
