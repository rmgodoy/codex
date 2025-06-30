
"use client";

import type { Combatant, PlayerCombatant } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { ChevronUp, ChevronDown, User, Bot } from "lucide-react";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

type Turn = Combatant & { turnId: string };

interface InitiativeTrackerProps {
  combatantsInTurnOrder: Turn[];
  activeTurnId: string;
  round: number;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  onCombatantUpdate: (combatant: Combatant) => void;
}

export default function InitiativeTracker({
  combatantsInTurnOrder,
  activeTurnId,
  round,
  onNextTurn,
  onPrevTurn,
  onCombatantUpdate,
}: InitiativeTrackerProps) {
    
  const handleInitiativeChange = (combatant: Combatant, newInitiative: number) => {
    onCombatantUpdate({ ...combatant, initiative: newInitiative });
  };
  
  const handleNat20Change = (combatant: PlayerCombatant, checked: boolean) => {
    onCombatantUpdate({ ...combatant, nat20: checked });
  };

  return (
    <div className="flex flex-col h-full p-4 bg-card">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Round</p>
        <p className="text-4xl font-bold">{round}</p>
      </div>
      <div className="flex gap-2 mb-4">
        <Button onClick={onPrevTurn} variant="outline" className="w-full">
          <ChevronUp className="h-4 w-4 mr-2"/> Prev
        </Button>
        <Button onClick={onNextTurn} className="w-full">
          Next <ChevronDown className="h-4 w-4 ml-2"/>
        </Button>
      </div>
      <h3 className="text-lg font-semibold mb-2 text-primary-foreground">Initiative Order</h3>
      <ScrollArea className="flex-1">
        <ul className="space-y-2 pr-4">
          {combatantsInTurnOrder.map((c) => (
            <li
              key={c.turnId}
              className={`p-3 rounded-lg border-l-4 transition-all ${
                c.turnId === activeTurnId
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
                    value={c.initiative}
                    onChange={(e) => handleInitiativeChange(c, parseInt(e.target.value, 10))}
                    className="w-20 h-8"
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
      </ScrollArea>
    </div>
  );
}
