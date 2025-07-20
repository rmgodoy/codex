
"use client";

import { useRef } from "react";
import {
  Cog,
  Upload,
  Download,
  FilePlus2,
  Moon,
  Sun,
  Palette,
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
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { setWorldDbName, importData } from "@/lib/idb";

interface SettingsMenuProps {
  onExport?: () => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  context: "landing" | "world";
}

export function SettingsMenu({
  onExport,
  onImport,
  context,
}: SettingsMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newWorldFileInputRef = useRef<HTMLInputElement>(null);
  const { setTheme } = useTheme();
  const { toast } = useToast();

  const handleImportNewWorld = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      let importedName = file.name.replace(/\.json$/, '').replace(/codex_world_/g, '').replace(/_/g, ' ');
      let slug = importedName.trim().toLowerCase().replace(/\s+/g, "-");
      
      try {
        const content = e.target?.result;
        if (typeof content !== "string") throw new Error("File content could not be read.");
        
        const importedData = JSON.parse(content);
        setWorldDbName(slug);
        await importData(importedData);
        
        toast({ title: "Import Successful", description: `World "${importedName}" has been created.` });
        
        window.location.hash = `#/${slug}`;
        window.location.reload();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: error.message || "Please check the file format.",
        });
      } finally {
        const target = event.target as HTMLInputElement;
        if(target) target.value = "";
      }
    };
    reader.readAsText(file);
  };
  
  const ThemeSwitcher = () => (
    <div className="pt-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Theme</h3>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Palette className="mr-2 h-4 w-4"/>
                    Change Theme
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>Oasis</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark-red")}>Crimson</DropdownMenuItem>
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
       <input
        type="file"
        ref={newWorldFileInputRef}
        onChange={handleImportNewWorld}
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
            {context === 'landing' && (
               <Button variant="outline" className="w-full" onClick={() => newWorldFileInputRef.current?.click()}>
                 <FilePlus2 className="mr-2" /> Import New World
               </Button>
            )}
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
