
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { TILE_ICON_NAMES } from "@/lib/map-data";
import { ArrowLeft } from "lucide-react";

interface MapPaintPanelProps {
  isBrushActive: boolean;
  onBrushActiveChange: (isActive: boolean) => void;
  brushSettings: { color: string; icon: string };
  onBrushSettingsChange: (settings: { color: string; icon: string }) => void;
  onBackToMapList: () => void;
}

export default function MapPaintPanel({
  isBrushActive,
  onBrushActiveChange,
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
          <h2 className="text-lg font-bold">Map Painter</h2>
          <p className="text-sm text-muted-foreground">Click a tile to edit its data.</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="brush-mode-switch">Brush Mode</Label>
            <Switch
              id="brush-mode-switch"
              checked={isBrushActive}
              onCheckedChange={onBrushActiveChange}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isBrushActive
                ? "Click and drag to paint tiles with the brush settings below."
                : "Enable to paint multiple tiles. Otherwise, click a tile to edit its data."}
          </p>
        </div>
        <Separator />
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
    </div>
  );
}
