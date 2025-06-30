"use client";

import { useState } from "react";
import type { CreatureWithDeeds } from "@/lib/types";
import CreatureListPanel from "@/components/monster-list-panel";
import CreatureEditorPanel from "@/components/monster-editor-panel";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skull } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const navLinks = [
    {
      href: '/deeds',
      label: 'Creature Deeds',
      group: 'Compendium',
    },
    {
      href: '/',
      label: 'Bestiary',
      group: 'Compendium',
    },
    {
      href: '/encounters',
      label: 'Encounters',
    },
  ];

  const compendiumLinks = navLinks.filter(link => link.group === 'Compendium');
  const otherLinks = navLinks.filter(link => !link.group);

  const desktopNav = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">Compendium</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {compendiumLinks.map(link => (
            <Link href={link.href} key={link.href} passHref>
              <DropdownMenuItem>{link.label}</DropdownMenuItem>
            </Link>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {otherLinks.map(link => (
        <Link href={link.href} key={link.href} passHref>
          <Button variant={pathname === link.href ? 'secondary' : 'ghost'}>
            {link.label}
          </Button>
        </Link>
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
      <SheetContent side="right">
        <div className="flex flex-col gap-4 p-4">
            <p className="font-bold text-lg">Compendium</p>
            {compendiumLinks.map(link => (
                <Link href={link.href} key={link.href} passHref>
                <Button variant={pathname === link.href ? 'secondary' : 'ghost'} className="w-full justify-start">{link.label}</Button>
                </Link>
            ))}
            <Separator className="my-2" />
            {otherLinks.map(link => (
                <Link href={link.href} key={link.href} passHref>
                <Button variant={pathname === link.href ? 'secondary' : 'ghost'} className="w-full justify-start">{link.label}</Button>
                </Link>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="flex flex-col h-screen">
      <header className="py-4 px-6 md:px-8 border-b border-border flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {pathname === '/' && <SidebarTrigger />}
          <Link href="/" className="flex items-center gap-3">
            <Skull className="text-primary h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary-foreground">Tresspasser Bestiary</h1>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-2">
            {desktopNav}
        </nav>
        <div className="md:hidden">
            {mobileNav}
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}


export default function Home() {
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [templateData, setTemplateData] = useState<Partial<CreatureWithDeeds> | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const refreshList = () => setDataVersion(v => v + 1);

  const handleSelectCreature = (id: string | null) => {
    setSelectedCreatureId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
  };

  const handleNewCreature = () => {
    setSelectedCreatureId(null);
    setIsCreatingNew(true);
    setTemplateData(null);
  };

  const handleUseAsTemplate = (creatureData: CreatureWithDeeds) => {
    const template = { ...creatureData };
    template.name = `Copy of ${creatureData.name || 'creature'}`;
    delete template.id;

    setSelectedCreatureId(null);
    setIsCreatingNew(true);
    setTemplateData(template);
  };

  const onCreatureSaveSuccess = (id: string) => {
    refreshList();
    setSelectedCreatureId(id);
    setIsCreatingNew(false);
    setTemplateData(null);
  };

  const onCreatureDeleteSuccess = () => {
    refreshList();
    setSelectedCreatureId(null);
    setIsCreatingNew(false); 
    setTemplateData(null);
  };
  
  const onEditCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      setSelectedCreatureId(null);
    }
  };

  return (
    <SidebarProvider>
      <MainLayout>
        <div className="flex flex-1 overflow-hidden h-full">
          <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
            <CreatureListPanel
              onSelectCreature={handleSelectCreature}
              onNewCreature={handleNewCreature}
              selectedCreatureId={selectedCreatureId}
              dataVersion={dataVersion}
              onImportSuccess={refreshList}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="bg-background/50 p-4 sm:p-6 md:p-8 h-full">
              <CreatureEditorPanel
                key={selectedCreatureId ?? (isCreatingNew ? 'new' : 'placeholder')}
                creatureId={selectedCreatureId}
                isCreatingNew={isCreatingNew}
                template={templateData}
                onCreatureSaveSuccess={onCreatureSaveSuccess}
                onCreatureDeleteSuccess={onCreatureDeleteSuccess}
                onUseAsTemplate={handleUseAsTemplate}
                onEditCancel={onEditCancel}
              />
            </div>
          </SidebarInset>
        </div>
      </MainLayout>
    </SidebarProvider>
  );
}