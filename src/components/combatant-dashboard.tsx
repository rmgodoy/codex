
"use client";

import { useState } from "react";
import type { Combatant, MonsterCombatant, CombatantState } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Heart, Plus, Minus, Swords, Eye, Trash2 } from "lucide-react";
import { DeedDisplay } from "./deed-display";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "./ui/badge";

const MonsterStatBlock = ({ combatant }: { combatant: MonsterCombatant }) => {
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
                    <div><Label>HP</Label><p className="text-lg font-bold">{combatant.attributes.HP}</p></div>
                    <div><Label>Speed</Label><p className="text-lg font-bold">{combatant.attributes.Speed}</p></div>
                    <div><Label>Accuracy</Label><p className="text-lg font-bold">{combatant.attributes.Accuracy}</p></div>
                    <div><Label>Initiative</Label><p className="text-lg font-bold">{combatant.attributes.Initiative}</p></div>
                    <div><Label>Guard</Label><p className="text-lg font-bold">{combatant.attributes.Guard}</p></div>
                    <div><Label>Resist</Label><p className="text-lg font-bold">{combatant.attributes.Resist}</p></div>
                    <div><Label>Roll Bonus</Label><p className="text-lg font-bold">{combatant.attributes.rollBonus > 0 ? `+${combatant.attributes.rollBonus}` : combatant.attributes.rollBonus}</p></div>
                    <div><Label>DMG</Label><p className="text-lg font-bold">{combatant.attributes.DMG}</p></div>
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

  const handleStateChange = (stateId: string, field: 'intensity' | 'duration', value: number) => {
    const newStates = combatant.states.map(s => 
      s.id === stateId ? { ...s, [field]: value } : s
    );
    onUpdate({ ...combatant, states: newStates });
  };
  
  const addState = () => {
      const newState: CombatantState = {
          id: crypto.randomUUID(),
          name: 'New State',
          intensity: 1,
          duration: 1,
      };
      onUpdate({...combatant, states: [...combatant.states, newState]});
  }

  const removeState = (stateId: string) => {
      onUpdate({...combatant, states: combatant.states.filter(s => s.id !== stateId)});
  }
  
  const updateStateName = (stateId: string, name: string) => {
    const newStates = combatant.states.map(s => 
      s.id === stateId ? { ...s, name } : s
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
                <Button variant="outline" size="sm" onClick={addState}><Plus className="h-4 w-4 mr-2"/>Add State</Button>
            </div>
            <div className="space-y-3">
              {combatant.states.length > 0 ? combatant.states.map(state => (
                <div key={state.id} className="flex items-center gap-4 p-3 bg-card-foreground/5 rounded-lg">
                  <Input value={state.name} onChange={e => updateStateName(state.id, e.target.value)} className="flex-1 font-semibold"/>
                  <Label htmlFor={`intensity-${state.id}`}>Intensity</Label>
                  <Input id={`intensity-${state.id}`} type="number" value={state.intensity} onChange={e => handleStateChange(state.id, 'intensity', parseInt(e.target.value, 10))} className="w-20" />
                  <Label htmlFor={`duration-${state.id}`}>Duration</Label>
                  <Input id={`duration-${state.id}`} type="number" value={state.duration} onChange={e => handleStateChange(state.id, 'duration', parseInt(e.target.value, 10))} className="w-20" />
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
