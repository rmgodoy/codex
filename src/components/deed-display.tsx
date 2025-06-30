
import { cn } from "@/lib/utils";
import type { Deed } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Badge } from "./ui/badge";

export const DeedDisplay = ({ deed, dmgReplacement }: { deed: Deed, dmgReplacement?: string }) => {
    const tierColors = {
        light: 'border-sky-400',
        heavy: 'border-amber-400',
        mighty: 'border-fuchsia-400',
    };
    const tierTextBg = {
        light: 'text-sky-300 bg-sky-900/50',
        heavy: 'text-amber-300 bg-amber-900/50',
        mighty: 'text-fuchsia-300 bg-fuchsia-900/50',
    }
    
    const processEffect = (text: string | undefined): string | undefined => {
        if (!text) {
            return undefined;
        }
        return dmgReplacement ? text.replace(/\\dd/g, dmgReplacement) : text;
    };

    return (
        <div className={cn("rounded-lg border bg-card-foreground/5 border-l-4 p-4 mb-4", tierColors[deed.tier])}>
            <div className="flex justify-between items-baseline mb-3">
                <h4 className="text-xl font-bold">{deed.name}</h4>
                <div className={cn("text-xs font-bold uppercase px-2 py-0.5 rounded-full", tierTextBg[deed.tier])}>{deed.tier}</div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3 border-b border-t border-border py-2">
                <p><strong className="font-semibold text-foreground/80">Type:</strong> <span className="capitalize">{deed.type}</span></p>
                <p><strong className="font-semibold text-foreground/80">Range:</strong> {deed.range}</p>
                <p><strong className="font-semibold text-foreground/80">Target:</strong> {deed.target}</p>
            </div>
            
            <div className="space-y-3 text-sm">
                {deed.effects.start && <div><Label className="text-primary-foreground/90 font-semibold">Start</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.start)}</p></div>}
                {deed.effects.base && <div><Label className="text-primary-foreground/90 font-semibold">Base</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.base)}</p></div>}
                {deed.effects.hit && <div><Label className="text-primary-foreground font-semibold">Hit</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.hit)}</p></div>}
                {deed.effects.shadow && <div><Label className="text-primary-foreground font-semibold">Shadow</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.shadow)}</p></div>}
                {deed.effects.end && <div><Label className="text-primary-foreground/90 font-semibold">End</Label><p className="text-foreground/90 mt-0.5 whitespace-pre-wrap pl-2 font-light">{processEffect(deed.effects.end)}</p></div>}
            </div>
             {deed.tags && deed.tags.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="flex flex-wrap gap-2">
                        {deed.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                </div>
            )}
        </div>
    );
};
