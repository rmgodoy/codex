
"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Brush, PaintBucket, Eraser, Pipette, AlertCircle, X, Home, Trees, Mountain, Castle, TowerControl, Tent, Waves, MapPin, Landmark, Skull, Building } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const ICONS = [
    { name: 'Home', component: Home }, { name: 'Trees', component: Trees }, { name: 'Mountain', component: Mountain },
    { name: 'Castle', component: Castle }, { name: 'TowerControl', component: TowerControl }, { name: 'Tent', component: Tent },
    { name: 'Waves', component: Waves }, { name: 'MapPin', component: MapPin }, { name: 'Landmark', component: Landmark },
    { name: 'Skull', component: Skull }, { name: 'Building', component: Building },
];

const TERRAIN_COLORS = [
    { name: 'Water', color: '#4A90E2' }, { name: 'Grass', color: '#7ED321' }, { name: 'Forest', color: '#417505' },
    { name: 'Stone', color: '#9B9B9B' }, { name: 'Desert', color: '#F5A623' }, { name: 'Snow', color: '#FFFFFF' },
];

interface PaintToolPanelProps {
    paintMode: 'brush' | 'bucket' | 'erase';
    setPaintMode: (mode: 'brush' | 'bucket' | 'erase') => void;
    paintColor: string;
    setPaintColor: (color: string) => void;
    isEyedropperActive: boolean;
    setIsEyedropperActive: (isActive: boolean) => void;
    isIconColorAuto: boolean;
    setIsIconColorAuto: (isAuto: boolean) => void;
    manualIconColor: string;
    setManualIconColor: (color: string) => void;
    paintIcon: string | null;
    setPaintIcon: (icon: string | null) => void;
}

export default function PaintToolPanel(props: PaintToolPanelProps) {
    const isEraseMode = props.paintMode === 'erase';

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Paint Mode</Label>
                <ToggleGroup type="single" value={props.paintMode} onValueChange={(value) => { if (value) props.setPaintMode(value as any) }} className="w-full">
                    <ToggleGroupItem value="brush" aria-label="Brush" className="w-1/3"><Brush className="h-4 w-4 mr-2" /> Brush</ToggleGroupItem>
                    <ToggleGroupItem value="bucket" aria-label="Bucket" className="w-1/3"><PaintBucket className="h-4 w-4 mr-2" /> Bucket</ToggleGroupItem>
                    <ToggleGroupItem value="erase" aria-label="Erase" className="w-1/3"><Eraser className="h-4 w-4 mr-2" /> Erase</ToggleGroupItem>
                </ToggleGroup>
            </div>
            <Separator />
            <fieldset disabled={isEraseMode || props.isEyedropperActive} className="space-y-4 disabled:opacity-50">
                <div className="space-y-2">
                    <Label htmlFor="color-picker">Tile Color</Label>
                    <Input id="color-picker" type="color" value={props.paintColor} onChange={(e) => props.setPaintColor(e.target.value)} className="w-full h-10 p-1" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>Terrain Colors</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant={props.isEyedropperActive ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => props.setIsEyedropperActive(prev => !prev)}>
                                        <Pipette className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Pick Tile Properties (or hold Alt)</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {TERRAIN_COLORS.map(({ name, color }) => (
                            <Button key={name} variant="outline" size="sm" className="h-8" onClick={() => props.setPaintColor(color)}>
                                <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }} />
                                <span className="ml-2">{name}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                <Separator />
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                        <Label>Tile Icon</Label>
                        <div className="flex items-center gap-1">
                            {!props.isIconColorAuto && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => props.setIsIconColorAuto(true)}>
                                                <AlertCircle className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Reset to automatic color</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            <Input
                                id="icon-color-picker" type="color" value={props.manualIconColor}
                                onChange={(e) => { props.setManualIconColor(e.target.value); props.setIsIconColorAuto(false); }}
                                className="w-10 h-10 p-1"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2">
                        {ICONS.map(({ name, component: Icon }) => (
                            <Button
                                key={name} variant="outline" size="icon"
                                onClick={() => props.setPaintIcon(prev => prev === name ? null : name)}
                                className={cn(props.paintIcon === name && "ring-2 ring-ring ring-offset-2 bg-accent text-accent-foreground")}
                            >
                                <Icon className="h-5 w-5" />
                            </Button>
                        ))}
                    </div>
                    {props.paintIcon && (
                        <Button variant="ghost" size="sm" className="w-full h-8" onClick={() => props.setPaintIcon(null)}>
                            <X className="h-4 w-4 mr-2" /> Clear Icon Selection
                        </Button>
                    )}
                </div>
            </fieldset>
        </div>
    );
}
