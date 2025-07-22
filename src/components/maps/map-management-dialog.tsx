import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogTrigger } from "@/components/ui/dialog";
import type { HexTile, Map as WorldMap, NewMap } from "@/lib/types";
import { addMap, updateMap, deleteMap } from "@/lib/idb";
import { useToast } from "@/hooks/use-toast";
import { generateHexGrid, generateRectangularHexGrid } from "@/lib/hex-utils";
import { Check, Cog, Edit, Plus, Trash2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function MapManagementDialog({
  maps,
  onMapsUpdate,
}: {
  maps: WorldMap[];
  onMapsUpdate: (newMapId?: string) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [newMapShape, setNewMapShape] = useState<"radial" | "rectangular">(
    "radial"
  );
  const [newMapRadius, setNewMapRadius] = useState(20);
  const [newMapWidth, setNewMapWidth] = useState(30);
  const [newMapHeight, setNewMapHeight] = useState(20);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const { toast } = useToast();

  const handleAddMap = async () => {
    if (!newMapName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please provide a valid name.",
      });
      return;
    }

    let newGrid: HexTile[];
    let newMap: NewMap;

    if (newMapShape === "radial") {
      if (!newMapRadius || newMapRadius <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Please provide a valid radius.",
        });
        return;
      }
      newGrid = generateHexGrid(newMapRadius);
      newMap = {
        name: newMapName.trim(),
        shape: "radial",
        radius: newMapRadius,
        tiles: newGrid,
        paths: [],
      };
    } else {
      if (
        !newMapWidth ||
        newMapWidth <= 0 ||
        !newMapHeight ||
        newMapHeight <= 0
      ) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Please provide valid width and height.",
        });
        return;
      }
      newGrid = generateRectangularHexGrid(newMapWidth, newMapHeight);
      newMap = {
        name: newMapName.trim(),
        shape: "rectangular",
        width: newMapWidth,
        height: newMapHeight,
        tiles: newGrid,
        paths: [],
      };
    }

    try {
      const newId = await addMap(newMap);
      toast({
        title: "Map Created",
        description: `'${newMapName}' has been added.`,
      });
      setNewMapName("");
      setNewMapRadius(20);
      setNewMapWidth(30);
      setNewMapHeight(20);
      onMapsUpdate(newId);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create map.",
      });
    }
  };

  const handleStartEdit = (map: WorldMap) => {
    setEditingId(map.id);
    setEditingName(map.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleRenameMap = async () => {
    if (!editingId || !editingName.trim()) return;
    const mapToUpdate = maps.find((m) => m.id === editingId);
    if (!mapToUpdate) return;
    try {
      await updateMap({ ...mapToUpdate, name: editingName.trim() });
      toast({ title: "Map Renamed" });
      onMapsUpdate();
      handleCancelEdit();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to rename map.",
      });
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    try {
      await deleteMap(mapId);
      toast({ title: "Map Deleted" });
      onMapsUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete map.",
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Cog className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Maps</DialogTitle>
          <DialogDescription>
            Add, rename, or delete your maps.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-4 p-3 border rounded-md">
            <Label>New Map</Label>
            <Input
              placeholder="New map name..."
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
            />
            <RadioGroup
              value={newMapShape}
              onValueChange={(v) => setNewMapShape(v as any)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="radial" id="radial" />
                <Label htmlFor="radial">Radial</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rectangular" id="rectangular" />
                <Label htmlFor="rectangular">Rectangular</Label>
              </div>
            </RadioGroup>

            {newMapShape === "radial" ? (
              <Input
                placeholder="Radius"
                type="number"
                value={newMapRadius}
                onChange={(e) =>
                  setNewMapRadius(parseInt(e.target.value, 10) || 0)
                }
              />
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Width"
                  type="number"
                  value={newMapWidth}
                  onChange={(e) =>
                    setNewMapWidth(parseInt(e.target.value, 10) || 0)
                  }
                />
                <Input
                  placeholder="Height"
                  type="number"
                  value={newMapHeight}
                  onChange={(e) =>
                    setNewMapHeight(parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>
            )}

            <Button onClick={handleAddMap} className="w-full">
              <Plus className="h-4 w-4" /> Add Map
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {maps.map((map) => (
              <div
                key={map.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50 gap-2"
              >
                {editingId === map.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameMap();
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleRenameMap}
                        aria-label="Save"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleCancelEdit}
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate" title={map.name}>
                      {map.name}
                    </span>
                    <div className="flex items-center shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleStartEdit(map)}
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{map.name}" map
                              and all of its tiles.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMap(map.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
