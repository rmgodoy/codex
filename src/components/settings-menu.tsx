
"use client";

import { useRef, useState, useEffect } from "react";
import {
  Cog,
  Upload,
  Download,
  FilePlus2,
  Palette,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { setWorldDbName, importData, listWorlds } from "@/lib/idb";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { WorldMetadata } from "@/lib/types";

interface SettingsMenuProps {
  onExport?: () => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  context: "landing" | "world";
}

function ImportNewWorldDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [newWorldName, setNewWorldName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [worlds, setWorlds] = useState<WorldMetadata[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      listWorlds().then(setWorlds);
      setNewWorldName("");
      setSelectedFile(null);
      setNameError(null);
      setIsImporting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (newWorldName) {
      const slug = newWorldName.trim().toLowerCase().replace(/\s+/g, "-");
      if (worlds.some(w => w.slug === slug)) {
        setNameError("A world with this name already exists.");
      } else {
        setNameError(null);
      }
    } else {
      setNameError(null);
    }
  }, [newWorldName, worlds]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!newWorldName) {
        const baseName = file.name.replace(/\.json$/, '').replace(/codex_world_/g, '').replace(/_/g, ' ');
        setNewWorldName(baseName);
      }
    }
  };

  const handleImport = () => {
    if (!selectedFile || !newWorldName.trim() || nameError) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const slug = newWorldName.trim().toLowerCase().replace(/\s+/g, "-");
      try {
        const content = e.target?.result;
        if (typeof content !== "string") throw new Error("File content could not be read.");
        
        const importedData = JSON.parse(content);
        
        // This sets the DB name for the import operation
        setWorldDbName(slug);
        await importData(importedData, newWorldName);
        
        toast({ title: "Import Successful", description: `World "${newWorldName}" has been created.` });
        
        // Redirect to the new world, which will trigger a full app reload and context update
        window.location.hash = `#/${slug}`;
        window.location.reload();

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: error.message || "Please check the file format.",
        });
        setIsImporting(false);
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
         <Button variant="outline" className="w-full">
            <FilePlus2 className="mr-2" /> Import New World
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import New World from File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="world-file">World File (.json)</Label>
                <Input id="world-file" type="file" accept=".json" onChange={handleFileChange} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="world-name">New World Name</Label>
                <Input id="world-name" value={newWorldName} onChange={(e) => setNewWorldName(e.target.value)} placeholder="e.g., Aethelgard"/>
                {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            </div>
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={!selectedFile || !newWorldName || !!nameError || isImporting}>
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isImporting ? "Importing..." : "Import World"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function SettingsMenu({
  onExport,
  onImport,
  context,
}: SettingsMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setTheme } = useTheme();
  
  const ThemeSwitcher = () => (
    <div className="pt-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Theme</h3>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                    <span>Change Theme</span>
                    <Palette />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTheme("dark")}>Default Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("light")}>Oasis</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark-red")}>Crimson</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("desert")}>Desert</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("space")}>Space</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("twilight")}>Twilight</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("chocolat")}>Chocolat</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("emerald")}>Emerald</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("silver")}>Silver</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("zombie")}>Zombie</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onImport}
        accept=".json"
        className="hidden"
      />
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Settings">
            <Cog className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {context === 'landing' && <ImportNewWorldDialog />}
            {context === 'world' && onImport && (
               <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <Upload className="mr-2" /> Import & Overwrite
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Import Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will overwrite all existing data in the current world
                        with data from the selected JSON file. This action cannot be
                        undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Proceed
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            )}
            {context === 'world' && onExport && (
                 <Button variant="outline" className="w-full" onClick={onExport}>
                    <Download className="mr-2" /> Export Current World
                 </Button>
            )}
            <ThemeSwitcher />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
