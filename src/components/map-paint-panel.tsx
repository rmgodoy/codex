
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "./ui/separator";
import { TILE_ICON_NAMES } from "@/lib/map-data";
import { ArrowLeft, Paintbrush, Database } from "lucide-react";

interface MapPaintPanelProps {
  editMode: 'paint' | 'data';
  onEditModeChange: (mode: 'paint' | 'data') => void;
  brushSettings: { color: string; icon: string };
  onBrushSettingsChange: (settings: { color: string; icon: string }) => void;
  onBackToMapList: () => void;
}

export default function MapPaintPanel({
  editMode,
  onEditModeChange,
  brushSettings,
  onBrushSettingsChange,
  onBackToMapList,
}: MapPaintPanelProps) {

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Button onClick={onBackToMapList} variant="ghost" size="icon" className="-ml-2">
          <ArrowLeft />
        </Button>
        <div>
          <h2 className="text-lg font-bold">Map Editor</h2>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2 pt-2">
          <Label>Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
                variant={editMode === 'paint' ? 'secondary' : 'outline'}
                onClick={() => onEditModeChange('paint')}
            >
                <Paintbrush className="mr-2 h-4 w-4" />
                Paint Mode
            </Button>
             <Button 
                variant={editMode === 'data' ? 'secondary' : 'outline'}
                onClick={() => onEditModeChange('data')}
            >
                <Database className="mr-2 h-4 w-4" />
                Data Mode
            </Button>
          </div>
          <p className="text-xs text-muted-foreground min-h-[40px]">
            {editMode === 'paint'
                ? "Click and drag to paint tiles with the brush settings below."
                : "Click a tile on the map to view and edit its data."}
          </p>
        </div>
        <Separator />
        {editMode === 'paint' && (
            <div className="space-y-4">
                <div>
                <Label>Brush Color</Label>
                <Input
                    type="color"
                    value={brushSettings.color}
                    onChange={(e) => onBrushSettingsChange({ ...brushSettings, color: e.target.value })}
                />
                </div>
                <div>
                <Label>Brush Icon</Label>
                <Select
                    onValueChange={(value) => onBrushSettingsChange({ ...brushSettings, icon: value })}
                    value={brushSettings.icon}
                >
                    <SelectTrigger><SelectValue placeholder="Select an icon" /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {TILE_ICON_NAMES.map(iconName => (
                        <SelectItem key={iconName} value={iconName} className="capitalize">{iconName}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
