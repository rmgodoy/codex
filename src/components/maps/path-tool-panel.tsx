import type { Map as WorldMap, Path } from "@/lib/types";
import { Check, CornerLeftUp, Paintbrush, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function PathToolPanel({
  activeMap,
  onPathUpdate,
  pathDrawingId,
  setPathDrawingId,
}: {
  activeMap: WorldMap | null;
  onPathUpdate: (paths: Path[]) => void;
  pathDrawingId: string | null;
  setPathDrawingId: (id: string | null) => void;
}) {
  const handleAddPath = () => {
    const newPath: Path = {
      id: crypto.randomUUID(),
      name: `Path ${(activeMap?.paths || []).length + 1}`,
      color: "#FFD700",
      strokeWidth: 3,
      points: [],
    };
    const newPaths = [newPath, ...(activeMap?.paths || [])];
    onPathUpdate(newPaths);
    setPathDrawingId(newPath.id);
  };

  const handleUpdatePath = (pathId: string, updates: Partial<Path>) => {
    const newPaths = (activeMap?.paths || []).map((p) =>
      p.id === pathId ? { ...p, ...updates } : p
    );
    onPathUpdate(newPaths);
  };

  const handleDeletePath = (pathId: string) => {
    if (pathDrawingId === pathId) {
      setPathDrawingId(null);
    }
    const newPaths = (activeMap?.paths || []).filter((p) => p.id !== pathId);
    onPathUpdate(newPaths);
  };

  const handleRemoveLastPoint = (pathId: string) => {
    const newPaths = (activeMap?.paths || []).map((p) => {
      if (p.id === pathId) {
        return { ...p, points: p.points.slice(0, -1) };
      }
      return p;
    });
    onPathUpdate(newPaths);
  };

  if (!activeMap) {
    return (
      <p className="text-sm text-muted-foreground text-center pt-4">
        Select a map to manage paths.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAddPath} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add New Path
      </Button>
      <Separator />
      <ScrollArea className="h-96">
        <div className="space-y-3 pr-2">
          {(activeMap.paths || []).map((path) => (
            <div
              key={path.id}
              className="p-3 border rounded-md bg-muted/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Input
                  value={path.name}
                  onChange={(e) =>
                    handleUpdatePath(path.id, { name: e.target.value })
                  }
                  className="h-8 flex-1"
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Path?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{path.name}"? This
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeletePath(path.id)}
                        className="bg-destructive"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex items-center gap-2">
                <Label>Color:</Label>
                <Input
                  type="color"
                  value={path.color}
                  onChange={(e) =>
                    handleUpdatePath(path.id, { color: e.target.value })
                  }
                  className="h-8 w-16 p-1"
                />
                <Label>Width:</Label>
                <Input
                  type="number"
                  value={path.strokeWidth}
                  min="1"
                  max="20"
                  onChange={(e) =>
                    handleUpdatePath(path.id, {
                      strokeWidth: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="h-8 flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={pathDrawingId === path.id ? "secondary" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    setPathDrawingId((prev: string) =>
                      {
                        return prev === path.id ? null : path.id;
                      }
                    )
                  }
                >
                  {pathDrawingId === path.id ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Paintbrush className="h-4 w-4 mr-2" />
                  )}
                  {pathDrawingId === path.id ? "Drawing..." : "Draw Path"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleRemoveLastPoint(path.id)}
                  disabled={path.points.length === 0}
                  aria-label="Remove last point"
                >
                  <CornerLeftUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
