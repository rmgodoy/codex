
"use client";

import { useRef, useState } from "react";
import { Cog, Upload, Download, FilePlus2, Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
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
import { useTheme } from "next-themes";

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
  const { setTheme } = useTheme();

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Settings">
              <Cog className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => newWorldFileInputRef.current?.click()}>
              <FilePlus2 className="mr-2" /> Import New World
            </DropdownMenuItem>
             <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 mr-2" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 mr-2" />
                    <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setTheme("light")}>Oasis</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>Default Dark</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 mr-2" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 mr-2" />
                <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>Oasis</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>Default Dark</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
