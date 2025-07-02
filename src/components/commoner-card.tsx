
"use client";

import type { Commoner } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function CommonerCard({ commoner }: CommonerCardProps) {
  const [alignmentType, alignmentTraits] = commoner.alignment.split(': ');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commoner</CardTitle>
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
            <Label>Alignment</Label>
            <p className="text-foreground/90"><span className="font-bold text-primary-foreground">{alignmentType}:</span> {alignmentTraits}</p>
        </div>
        <div>
            <Label>Past Life</Label>
            <p className="text-muted-foreground">{commoner.pastLife}</p>
        </div>
         <div>
            <Label>Equipment</Label>
            <p className="text-muted-foreground">{commoner.equipment}</p>
        </div>
      </CardContent>
    </Card>
  );
}
