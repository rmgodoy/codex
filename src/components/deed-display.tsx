
import { cn } from "@/lib/utils";
import type { Deed } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { stepDownDamageDie, stepUpDamageDie } from "@/lib/roles";
import { useWorld } from "./world-provider";

export const DeedDisplay = ({ deed, dmgReplacement, isLiveEncounter }: { deed: Deed, dmgReplacement?: string, isLiveEncounter?: boolean }) => {
    const { worldSlug } = useWorld();
    const tierColors = {
        light: 'border-sky-400',
        heavy: 'border-amber-400',
        mighty: 'border-fuchsia-400',
        tyrant: 'border-red-600',
        special: 'border-yellow-400',
    };
    const tierTextBg = {
        light: 'text-sky-300 bg-sky-900/50',
        heavy: 'text-amber-300 bg-amber-900/50',
        mighty: 'text-fuchsia-300 bg-fuchsia-900/50',
        tyrant: 'text-red-300 bg-red-900/50',
        special: 'text-yellow-300 bg-yellow-900/50',
    }
    
    const processEffect = (text: string | undefined): string | undefined => {
        if (!text) {
            return undefined;
        }
        if (!dmgReplacement) {
            return text.replace(/\\dd([+\-]\d+)?/g, '...');
        }
        // Regex to find all instances of \dd, \dd+#, or \dd-#
        const regex = /\\dd([+\-]\d+)?/g;
        return text.replace(regex, (match, modifier) => {
            let currentDie = dmgReplacement;
            if (modifier) {
                const modValue = parseInt(modifier, 10);
                if (modValue > 0) {
                    for (let i = 0; i < modValue; i++) {
                        currentDie = stepUpDamageDie(currentDie);
                    }
                } else if (modValue < 0) {
                    for (let i = 0; i < Math.abs(modValue); i++) {
                        currentDie = stepDownDamageDie(currentDie);
                    }
                }
            }
            return currentDie;
        });
    };

    const attackString = `${deed.deedType} ${deed.actionType} VS ${deed.versus}`.toUpperCase();
    const fullTargetString = `${attackString} | ${deed.target}`;

    const DeedTitle = () => {
        const titleContent = <h4 className="text-xl font-bold">{deed.name}</h4>;
        if (isLiveEncounter) {
            return titleContent;
        }
        return <a href={`#/${worldSlug}/deeds/${deed.id}`} className="hover:underline">{titleContent}</a>;
    };

    return (
        <div className={cn("rounded-lg border bg-card-foreground/5 border-l-4 p-4 mb-4", tierColors[deed.tier])}>
            <div className="flex justify-between items-baseline mb-3">
                <DeedTitle />
                <div className={cn("text-xs font-bold uppercase px-2 py-0.5 rounded-full", tierTextBg[deed.tier])}>{deed.tier}</div>
            </div>
            <div className="text-sm text-muted-foreground mb-3 border-b border-t border-border py-2">
                <p className="text-foreground/90">{fullTargetString}</p>
            </div>
            
            <div className="space-y-3 text-sm">
                {deed.effects.start && <div><Label className="text-foreground/90 font-semibold uppercase">Start</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.start)}</p></div>}
                {deed.effects.base && <div><Label className="text-foreground/90 font-semibold uppercase">Base</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.base)}</p></div>}
                {deed.effects.hit && <div><Label className="text-foreground font-semibold uppercase">Hit</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.hit)}</p></div>}
                {deed.effects.spark && <div><Label className="text-foreground/90 font-semibold uppercase">Spark (Critical Hit)</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.spark)}</p></div>}
                {deed.effects.shadow && <div><Label className="text-foreground font-semibold uppercase">Shadow (Critical Failure)</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.shadow)}</p></div>}
                {deed.effects.after && <div><Label className="text-foreground/90 font-semibold uppercase">After</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.after)}</p></div>}
            </div>
        </div>
    );
};
