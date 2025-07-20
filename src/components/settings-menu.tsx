
"use client";

import { useRef, useState } from "react";
import { Cog, Upload, Download, FilePlus2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface SettingsMenuProps {
  onExport?: () => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImportNewWorld?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  context: "landing" | "world";
}

export function SettingsMenu({
  onExport,
  onImport,
  onImportNewWorld,
  context,
}: SettingsMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newWorldFileInputRef = useRef<HTMLInputElement>(null);
  const [isLandingSettingsOpen, setIsLandingSettingsOpen] = useState(false);

  if (context === "landing") {
    return (
      <>
        <input
          type="file"
          ref={newWorldFileInputRef}
          onChange={onImportNewWorld}
          accept=".json"
          className="hidden"
        />
        <Dialog
          open={isLandingSettingsOpen}
          onOpenChange={setIsLandingSettingsOpen}
        >
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Settings">
              <Cog className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Application-wide settings and actions.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => newWorldFileInputRef.current?.click()}
              >
                <FilePlus2 className="mr-2" /> Import New World
              </Button>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsLandingSettingsOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onImport}
        accept=".json"
        className="hidden"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Settings">
            <Cog className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {context === "world" && onImport && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Upload className="mr-2" /> Import & Overwrite
                </DropdownMenuItem>
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

          {context === "world" && onExport && (
            <DropdownMenuItem onSelect={onExport}>
              <Download className="mr-2" /> Export Current World
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
