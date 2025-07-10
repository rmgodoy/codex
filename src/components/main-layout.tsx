
'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Skull, Menu, Upload, Download, BookCopy, Dices, FlaskConical, Warehouse, Sword, Users, Shield, User, Calendar, Map, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { importData } from '@/lib/idb';
import { useWorld } from './world-provider';


export default function MainLayout({ children, showSidebarTrigger = true, showImportExport = true }: { children: React.ReactNode, showSidebarTrigger?: boolean, showImportExport?: boolean }) {
  const { worldSlug, worldName } = useWorld();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [hash, setHash] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !worldSlug) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error("File content could not be read as text.");
        }
        const importedData = JSON.parse(content);
        
        await importData(importedData);
        
        toast({ title: "Import Successful", description: "Data has been overwritten. The application will now reload." });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (error: any) {
        console.error("Import failed:", error);
        toast({ variant: "destructive", title: "Import Failed", description: error.message || "Please check the file format and content." });
      } finally {
        if(fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };
  
  const finalPageTitle = useMemo(() => {
    if (!worldSlug) return "Tresspasser Compendium";
    const pageKey = hash.split('/').slice(2).join('/');
    if (pageKey.startsWith('random/encounter-tables')) return 'Encounter Tables';
    if (pageKey.startsWith('random/treasures')) return 'Treasures';
    if (pageKey.startsWith('random/commoners')) return 'Commoners';
    if (pageKey.startsWith('alchemy')) return 'Alchemy';
    if (pageKey.startsWith('rooms')) return 'Rooms';
    if (pageKey.startsWith('dungeons')) return 'Dungeons';
    if (pageKey.startsWith('items')) return 'Items';
    if (pageKey.startsWith('npcs')) return 'NPCs';
    if (pageKey.startsWith('factions')) return 'Factions';
    if (pageKey.startsWith('calendar')) return 'Calendar';
    if (pageKey.startsWith('maps')) return 'Maps';
    if (pageKey.startsWith('pantheon')) return 'Pantheon';
    if (pageKey.startsWith('bestiary')) return 'Bestiary';
    if (pageKey.startsWith('deeds')) return 'Deeds';
    if (pageKey.startsWith('encounters')) return 'Encounters';
    return worldName || 'Compendium';
  }, [hash, worldName, worldSlug]);

  const navLinks = [
    { href: `/#/${worldSlug}/alchemy`, label: 'Alchemy', group: 'Compendium' },
    { href: `/#/${worldSlug}/bestiary`, label: 'Bestiary', group: 'Compendium' },
    { href: `/#/${worldSlug}/deeds`, label: 'Deeds', group: 'Compendium' },
    { href: `/#/${worldSlug}/encounters`, label: 'Encounters', group: 'Compendium' },
    { href: `/#/${worldSlug}/items`, label: 'Items', group: 'Compendium' },
    { href: `/#/${worldSlug}/npcs`, label: 'NPCs', group: 'Compendium' },
    { href: `/#/${worldSlug}/factions`, label: 'Factions', group: 'Compendium' },
    { href: `/#/${worldSlug}/pantheon`, label: 'Pantheon', group: 'Compendium' },
    { href: `/#/${worldSlug}/rooms`, label: 'Rooms', group: 'Compendium' },
    { href: `/#/${worldSlug}/random/treasures`, label: 'Treasures', group: 'Compendium' },
    { href: `/#/${worldSlug}/random/encounter-tables`, label: 'Encounter Tables', group: 'Random' },
    { href: `/#/${worldSlug}/random/commoners`, label: 'Commoners', group: 'Random' },
    { href: `/#/${worldSlug}/dungeons`, label: 'Dungeons' },
    { href: `/#/${worldSlug}/calendar`, label: 'Calendar' },
    { href: `/#/${worldSlug}/maps`, label: 'Maps' },
  ];

  const compendiumLinks = navLinks.filter(link => link.group === 'Compendium');
  const randomLinks = navLinks.filter(link => link.group === 'Random');
  const otherLinks = navLinks.filter(link => !link.group);

  const desktopNav = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">Compendium</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {compendiumLinks.map(link => (
            <a href={link.href} key={link.href}>
              <DropdownMenuItem>{link.label}</DropdownMenuItem>
            </a>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">Random</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {randomLinks.map(link => (
            <a href={link.href} key={link.href}>
              <DropdownMenuItem>{link.label}</DropdownMenuItem>
            </a>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {otherLinks.map(link => (
        <a href={link.href} key={link.href}>
          <Button variant={hash.endsWith(link.href.split('/').pop()!) ? 'secondary' : 'ghost'}>
            {link.label}
          </Button>
        </a>
      ))}
    </>
  );

  const mobileNav = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1">
            <div className="flex flex-col gap-4 p-4">
            <p className="font-bold text-lg">Compendium</p>
            {compendiumLinks.map(link => (
                <a href={link.href} key={link.href}>
                <Button variant={hash.endsWith(link.href.split('/').pop()!) ? 'secondary' : 'ghost'} className="w-full justify-start">{link.label}</Button>
                </a>
            ))}
            <Separator className="my-2" />
            <p className="font-bold text-lg">Random</p>
            {randomLinks.map(link => (
                <a href={link.href} key={link.href}>
                <Button variant={hash.endsWith(link.href.split('/').pop()!) ? 'secondary' : 'ghost'} className="w-full justify-start">{link.label}</Button>
                </a>
            ))}
            <Separator className="my-2" />
            {otherLinks.map(link => (
                <a href={link.href} key={link.href}>
                <Button variant={hash.endsWith(link.href.split('/').pop()!) ? 'secondary' : 'ghost'} className="w-full justify-start">{link.label}</Button>
                </a>
            ))}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
  
  const isWorldContext = !!worldSlug;

  return (
    <div className="flex flex-col h-screen" style={{'width': '100%'}}>
      <header className="py-4 px-6 md:px-8 border-b border-border flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {(isWorldContext && showSidebarTrigger) && <SidebarTrigger />}
          <a href="/#" className="flex items-center gap-3">
            <Skull className="text-primary h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary-foreground whitespace-nowrap">
                {finalPageTitle}
            </h1>
          </a>
          {isWorldContext && (
            <>
              <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
              <nav className="hidden md:flex items-center gap-1">
                {desktopNav}
              </nav>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
            {showImportExport && worldSlug && (
                <>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImport}
                    accept=".json"
                    className="hidden"
                />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Import Data">
                            <Upload className="h-5 w-5" />
                            <span className="sr-only">Import Data</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Import Data?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will overwrite all existing data in the current world with data from the selected JSON file. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => fileInputRef.current?.click()}>
                            Proceed
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </>
            )}
          {isWorldContext && <div className="md:hidden">
            {mobileNav}
          </div>}
        </div>
      </header>
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}
