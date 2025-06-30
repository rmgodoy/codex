
"use client";

import { useState, useMemo } from "react";
import type { Combatant, MonsterCombatant, CombatantState, PlayerCombatant } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Heart, Plus, Swords, Trash2, Zap, Rabbit, Crosshair, Shield, ShieldHalf, Dice5, ChevronsUpDown, Check } from "lucide-react";
import { DeedDisplay } from "./deed-display";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { COMMON_STATES } from "@/lib/states";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";


const StatDisplay = ({ label, modified, original, isBonus }: { label: string, modified: number | string, original: number | string, isBonus?: boolean }) => {
  const isModified = modified !== original;
  const modifier = (typeof modified === 'number' && typeof original === 'number') ? modified - original : 0;
  
  let colorClass = "";
  if (isModified) {
    if ((isBonus && modifier > 0) || (!isBonus && modifier < 0)) {
        colorClass = "text-green-400"; // Good modification
    } else {
        colorClass = "text-red-400"; // Bad modification
    }
  }

  return (
    <div>
        <Label>{label}</Label>
        {isModified ? (
            <p className="text-lg font-bold">
                <span className={colorClass}>{modified}</span>
                <span className="text-muted-foreground text-sm ml-2 line-through">{original}</span>
            </p>
        ) : (
             <p className="text-lg font-bold">{original}</p>
        )}
    </div>
  )
}

interface CombatantDashboardProps {
  combatant: Combatant;
  onUpdate: (combatant: Combatant) => void;
}

export default function CombatantDashboard({ combatant, onUpdate }: CombatantDashboardProps) {
  const [hpChange, setHpChange] = useState("");
  const [selectedCommonState, setSelectedCommonState] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [isStatePopoverOpen, setIsStatePopoverOpen] = useState(false);
  
  const { modifiedAttributes, originalAttributes } = useMemo(() => {
    if (combatant.type === 'player' || !combatant.states) return { modifiedAttributes: null, originalAttributes: null };
    
    const original = { ...combatant.attributes };
    const modified = { ...combatant.attributes };

    combatant.states.forEach(state => {
        if (state.effect) {
            const { attribute, modifier } = state.effect;
            const change = state.intensity * (modifier === 'bonus' ? 1 : -1);
            if (typeof modified[attribute] === 'number') {
                (modified[attribute] as number) += change;
            }
        }
    });

    return { modifiedAttributes: modified, originalAttributes: original };
  }, [combatant]);

  const filteredCommonStates = useMemo(() => {
    return COMMON_STATES.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()));
  }, [stateSearch]);

  if (combatant.type === 'player') {
    return (
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl font-bold">{combatant.name}</CardTitle>
            <CardDescription>Player Character</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">Player turn. No stats to display.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleHpChange = () => {
    if (!hpChange) return;
    
    let change = 0;
    if (hpChange.startsWith('+') || hpChange.startsWith('-')) {
        change = parseInt(hpChange, 10);
    } else {
        change = parseInt(hpChange, 10) - combatant.currentHp;
    }
    
    if (!isNaN(change)) {
      let newHp = combatant.currentHp + change;
      if (combatant.template === 'Underling') {
        newHp = Math.min(1, Math.max(0, newHp));
      }
      onUpdate({ ...combatant, currentHp: newHp });
    }
    setHpChange("");
  };

  const handleStateChange = (stateId: string, field: 'intensity', value: number) => {
    const newStates = combatant.states.map(s => 
      s.id === stateId ? { ...s, [field]: value } : s
    );
    onUpdate({ ...combatant, states: newStates });
  };
  
  const addCustomState = () => {
      const newState: CombatantState = {
          id: crypto.randomUUID(),
          name: 'New State',
          intensity: 1,
      };
      onUpdate({...combatant, states: [...combatant.states, newState]});
  }

  const addSelectedCommonState = () => {
    const stateToAdd = COMMON_STATES.find(s => s.name === selectedCommonState);
    if (!stateToAdd) return;
    
    const newState: CombatantState = {
      id: crypto.randomUUID(),
      name: stateToAdd.name,
      intensity: 1,
      description: stateToAdd.description,
      effect: stateToAdd.effect,
    };
  
    onUpdate({ ...combatant, states: [...combatant.states, newState]});
    setSelectedCommonState(''); // Reset select
  }


  const removeState = (stateId: string) => {
      onUpdate({...combatant, states: combatant.states.filter(s => s.id !== stateId)});
  }
  
  const updateState = (stateId: string, updatedState: Partial<CombatantState>) => {
    const newStates = combatant.states.map(s => 
      s.id === stateId ? { ...s, ...updatedState } : s
    );
    onUpdate({ ...combatant, states: newStates });
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl sm:text-4xl font-bold">{combatant.name}</CardTitle>
              {combatant.type === 'monster' && <CardDescription>Lvl {combatant.level} {combatant.template} {combatant.role} • TR {combatant.TR}</CardDescription>}
            </div>
          </div>
           {(combatant.template === 'Paragon' || combatant.template === 'Tyrant') && (
            <div className="text-sm text-amber-300 bg-amber-900/50 p-2 rounded-md mt-2">
              <p><strong>Extra Turn:</strong> This creature takes an additional turn at the end of the round.</p>
              <p>Immune to effects that delay its turn (loses an action point on its next turn instead).</p>
            </div>
          )}
          {combatant.template === 'Tyrant' && (
             <div className="text-sm text-amber-300 bg-amber-900/50 p-2 rounded-md mt-2">
              <p><strong>Unstoppable:</strong> Can make a free prevail check against one state at the end of each round.</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="hp" className="flex items-center gap-2 text-lg shrink-0"><Heart className="h-6 w-6 text-red-500" /> HP</Label>
              <Input 
                  id="hp" 
                  type="number" 
                  value={combatant.currentHp} 
                  onChange={(e) => {
                    let newHp = parseInt(e.target.value, 10) || 0;
                    if (combatant.template === 'Underling') {
                      newHp = Math.min(1, Math.max(0, newHp));
                    }
                    onUpdate({ ...combatant, currentHp: newHp })
                  }}
                  className="w-24 text-lg font-bold"
              />
              {combatant.type === 'monster' && <span className="text-muted-foreground text-lg">/ {combatant.maxHp}</span>}
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                 <Input 
                    placeholder="+5 or -10" 
                    value={hpChange}
                    onChange={e => setHpChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleHpChange()}
                    className="flex-1"
                 />
                 <Button onClick={handleHpChange} size="sm">Apply</Button>
            </div>
          </div>
          
          {combatant.type === 'monster' && modifiedAttributes && originalAttributes && (
             <>
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center my-6">
                    <StatDisplay label="Speed" modified={modifiedAttributes.Speed} original={originalAttributes.Speed} />
                    <StatDisplay label="Accuracy" modified={modifiedAttributes.Accuracy} original={originalAttributes.Accuracy} isBonus />
                    <StatDisplay label="Guard" modified={modifiedAttributes.Guard} original={originalAttributes.Guard} isBonus />
                    <StatDisplay label="Resist" modified={modifiedAttributes.Resist} original={originalAttributes.Resist} isBonus />
                    <StatDisplay label="Roll Bonus" modified={modifiedAttributes.rollBonus > 0 ? `+${modifiedAttributes.rollBonus}`: modifiedAttributes.rollBonus} original={originalAttributes.rollBonus > 0 ? `+${originalAttributes.rollBonus}`: originalAttributes.rollBonus} isBonus />
                    <StatDisplay label="DMG" modified={combatant.attributes.DMG} original={combatant.attributes.DMG} />
                    <StatDisplay label="Initiative" modified={modifiedAttributes.Initiative} original={originalAttributes.Initiative} isBonus />
                </div>
             </>
          )}

          <Separator />
          
          <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-primary-foreground">States</h3>
            </div>
             <div className="flex flex-wrap items-center gap-2 mb-4">
                <Popover open={isStatePopoverOpen} onOpenChange={setIsStatePopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isStatePopoverOpen}
                            className="flex-1 min-w-[180px] justify-between"
                        >
                            {selectedCommonState || "Select a common state..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <div className="p-2 border-b">
                            <Input
                                placeholder="Search states..."
                                value={stateSearch}
                                onChange={e => setStateSearch(e.target.value)}
                                className="h-9"
                                autoFocus
                            />
                        </div>
                        <ScrollArea className="h-[200px]">
                            <div className="p-1">
                                {filteredCommonStates.length > 0 ? filteredCommonStates.map(state => (
                                    <Button
                                        key={state.name}
                                        variant="ghost"
                                        className={cn(
                                          "w-full justify-start font-normal h-auto py-2",
                                          selectedCommonState === state.name && "bg-accent"
                                        )}
                                        onClick={() => {
                                            setSelectedCommonState(state.name);
                                            setIsStatePopoverOpen(false);
                                            setStateSearch("");
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", selectedCommonState === state.name ? "opacity-100" : "opacity-0")} />
                                        {state.name}
                                    </Button>
                                )) : (
                                    <p className="text-center text-sm text-muted-foreground p-4">No state found.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>

              <div className="flex items-center gap-2">
                <Button onClick={addSelectedCommonState} disabled={!selectedCommonState}>
                    <span className="sm:hidden">Add</span>
                    <span className="hidden sm:inline">Add State</span>
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="outline" onClick={addCustomState}>
                    <span className="sm:hidden">Custom</span>
                    <span className="hidden sm:inline">Add Custom</span>
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {combatant.states.length > 0 ? combatant.states.map(state => (
                <div key={state.id} className="flex items-center gap-2 p-3 bg-card-foreground/5 rounded-lg">
                  <Input 
                    value={state.name} 
                    onChange={e => updateState(state.id, { name: e.target.value, effect: undefined, description: undefined })}
                    className="flex-1 font-semibold min-w-0"
                    disabled={!!COMMON_STATES.find(s => s.name === state.name)}
                  />
                  <Label htmlFor={`intensity-${state.id}`} className="hidden sm:inline shrink-0">Intensity</Label>
                  <Input 
                    id={`intensity-${state.id}`} 
                    type="number" 
                    min="0"
                    value={state.intensity} 
                    onChange={e => handleStateChange(state.id, 'intensity', Math.max(0, parseInt(e.target.value, 10) || 0))} 
                    className="w-20 shrink-0" />
                  <Button variant="ghost" size="icon" onClick={() => removeState(state.id)} className="shrink-0"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </div>
              )) : <p className="text-muted-foreground text-center">No active states.</p>}
            </div>
          </div>
          
          {combatant.type === 'monster' && combatant.deeds.length > 0 && (
            <>
                <Separator/>
                <div>
                    <h3 className="text-xl font-semibold text-primary-foreground mb-4">Deeds</h3>
                    {combatant.deeds.map((deed, i) => (
                        <DeedDisplay key={i} deed={deed} dmgReplacement={combatant.attributes.DMG} />
                    ))}
                </div>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
