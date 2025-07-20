
"use client";

import type { Commoner } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CommonerCardProps {
  commoner: Commoner;
}

const AttributeDisplay = ({ label, value, isKey }: { label: string; value: number; isKey?: boolean }) => (
  <div className={cn("rounded-md p-3 text-center", isKey ? "bg-primary/20" : "bg-muted/50")}>
    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    <p className={cn("text-4xl font-bold", isKey && "text-primary")}>{value}</p>
  </div>
);

const CombatValueDisplay = ({ label, value }: { label: string; value: number | string }) => (
  <div>
    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);


export default function CommonerCard({ commoner }: CommonerCardProps) {
  const [alignmentType, alignmentTraits] = commoner.alignment.split(': ');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commoner</CardTitle>
        <CardDescription>{commoner.pastLife}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Attributes</Label>
          <div className="grid grid-cols-4 gap-2 mt-1">
            <AttributeDisplay label="Might" value={commoner.attributes.might} isKey={commoner.keyAttribute === 'Might'} />
            <AttributeDisplay label="Agility" value={commoner.attributes.agility} isKey={commoner.keyAttribute === 'Agility'} />
            <AttributeDisplay label="Intellect" value={commoner.attributes.intellect} />
            <AttributeDisplay label="Spirit" value={commoner.attributes.spirit} />
          </div>
        </div>
        <Separator />
         <div>
          <Label>Combat Values</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mt-2">
            <CombatValueDisplay label="HP" value={commoner.combatValues.hp} />
            <CombatValueDisplay label="Speed" value={commoner.combatValues.speed} />
            <CombatValueDisplay label="Initiative" value={commoner.combatValues.initiative} />
            <CombatValueDisplay label="Accuracy" value={commoner.combatValues.accuracy} />
            <CombatValueDisplay label="Guard" value={commoner.combatValues.guard} />
            <CombatValueDisplay label="Resist" value={commoner.combatValues.resist} />
            <CombatValueDisplay label="Prevail" value={commoner.combatValues.prevail} />
            <CombatValueDisplay label="Tenacity" value={commoner.combatValues.tenacity} />
          </div>
        </div>
        <Separator />
        <div>
            <Label>Alignment</Label>
            <p className="text-foreground/90"><span className="font-bold text-foreground">{alignmentType}:</span> {alignmentTraits}</p>
        </div>
        <div>
            <Label>Skill</Label>
            <p className="text-muted-foreground">{commoner.skill} (Bonus: +{commoner.combatValues.skillBonus}, Die: {commoner.combatValues.skillDie})</p>
        </div>
         <div>
            <Label>Equipment</Label>
            <p className="text-muted-foreground">{commoner.equipment}</p>
        </div>
      </CardContent>
    </Card>
  );
}
