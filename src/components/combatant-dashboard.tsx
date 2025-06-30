
"use client";

import { useState, useMemo } from "react";
import type { Combatant, MonsterCombatant, CombatantState, PlayerCombatant } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Heart, Plus, Swords, Eye, Trash2 } from "lucide-react";
import { DeedDisplay } from "./deed-display";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "./ui/badge";
import { COMMON_STATES, CommonState } from "@/lib/states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "@/lib/utils";


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


const MonsterStatBlock = ({ combatant }: { combatant: MonsterCombatant }) => {
    const { modifiedAttributes, originalAttributes } = useMemo(() => {
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


    return (
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="text-3xl font-bold">{combatant.name}</DialogTitle>
                <DialogDescription>
                    Lvl {combatant.level} {combatant.role} • TR {combatant.TR}
                </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-6">
                <div className="grid grid-cols-4 gap-4 text-center my-4">
                    <StatDisplay label="HP" modified={combatant.attributes.HP} original={combatant.attributes.HP} />
                    <StatDisplay label="Speed" modified={modifiedAttributes.Speed} original={originalAttributes.Speed} />
                    <StatDisplay label="Accuracy" modified={modifiedAttributes.Accuracy} original={originalAttributes.Accuracy} isBonus />
                    <StatDisplay label="Initiative" modified={modifiedAttributes.Initiative} original={originalAttributes.Initiative} isBonus />
                    <StatDisplay label="Guard" modified={modifiedAttributes.Guard} original={originalAttributes.Guard} isBonus />
                    <StatDisplay label="Resist" modified={modifiedAttributes.Resist} original={originalAttributes.Resist} isBonus />
                    <StatDisplay label="Roll Bonus" modified={modifiedAttributes.rollBonus > 0 ? `+${modifiedAttributes.rollBonus}`: modifiedAttributes.rollBonus} original={originalAttributes.rollBonus > 0 ? `+${originalAttributes.rollBonus}`: originalAttributes.rollBonus} isBonus />
                    <StatDisplay label="DMG" modified={combatant.attributes.DMG} original={combatant.attributes.DMG} />
                </div>
                <Separator />
                <div className="my-4">
                    <h3 className="text-xl font-semibold mb-2 text-primary-foreground">Deeds</h3>
                    {combatant.deeds.map((deed, i) => <DeedDisplay key={i} deed={deed} dmgReplacement={combatant.attributes.DMG} />)}
                </div>
                 {combatant.abilities && <>
                    <Separator />
                    <div className="my-4">
                        <h3 className="text-xl font-semibold mb-2 text-primary-foreground">Abilities</h3>
                        <p className="whitespace-pre-wrap">{combatant.abilities}</p>
                    </div>
                 </>}
            </div>
        </DialogContent>
    )
}

interface CombatantDashboardProps {
  combatant: Combatant;
  onUpdate: (combatant: Combatant) => void;
}

export default function CombatantDashboard({ combatant, onUpdate }: CombatantDashboardProps) {
  const [hpChange, setHpChange] = useState("");
  const [selectedCommonState, setSelectedCommonState] = useState("");

  if (combatant.type === 'player') {
    return (
      <div className="p-4 sm:p-6 md:p-8 h-full w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-bold">{combatant.name}</CardTitle>
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
      onUpdate({ ...combatant, currentHp: combatant.currentHp + change });
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
    <div className="p-4 sm:p-6 md:p-8 h-full w-full">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-4xl font-bold">{combatant.name}</CardTitle>
              {combatant.type === 'monster' && <CardDescription>Lvl {combatant.level} {combatant.role} • TR {combatant.TR}</CardDescription>}
            </div>
            {combatant.type === 'monster' && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2"/> View Stats</Button>
                    </DialogTrigger>
                    <MonsterStatBlock combatant={combatant} />
                </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="hp" className="flex items-center gap-2 text-lg"><Heart className="h-6 w-6 text-red-500" /> HP</Label>
            <Input 
                id="hp" 
                type="number" 
                value={combatant.currentHp} 
                onChange={(e) => onUpdate({ ...combatant, currentHp: parseInt(e.target.value, 10) || 0 })}
                className="w-24 text-lg font-bold"
            />
            {combatant.type === 'monster' && <span className="text-muted-foreground text-lg">/ {combatant.maxHp}</span>}
            <div className="flex items-center gap-2">
                 <Input 
                    placeholder="+5 or -10" 
                    value={hpChange}
                    onChange={e => setHpChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleHpChange()}
                    className="w-28"
                 />
                 <Button onClick={handleHpChange} size="sm">Apply</Button>
            </div>
          </div>

          <Separator />
          
          <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-primary-foreground">States</h3>
            </div>
             <div className="flex items-center gap-2 mb-4">
              <Select value={selectedCommonState} onValueChange={setSelectedCommonState}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select a common state..." /></SelectTrigger>
                <SelectContent>
                  {COMMON_STATES.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={addSelectedCommonState} disabled={!selectedCommonState}>Add State</Button>
              <Separator orientation="vertical" className="h-6 mx-2" />
              <Button variant="outline" onClick={addCustomState}>Add Custom</Button>
            </div>
            <div className="space-y-3">
              {combatant.states.length > 0 ? combatant.states.map(state => (
                <div key={state.id} className="flex items-center gap-4 p-3 bg-card-foreground/5 rounded-lg">
                  <Input 
                    value={state.name} 
                    onChange={e => updateState(state.id, { name: e.target.value, effect: undefined, description: undefined })}
                    className="flex-1 font-semibold"
                    disabled={!!COMMON_STATES.find(s => s.name === state.name)}
                  />
                  <Label htmlFor={`intensity-${state.id}`}>Intensity</Label>
                  <Input id={`intensity-${state.id}`} type="number" value={state.intensity} onChange={e => handleStateChange(state.id, 'intensity', parseInt(e.target.value, 10))} className="w-20" />
                  <Button variant="ghost" size="icon" onClick={() => removeState(state.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
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
