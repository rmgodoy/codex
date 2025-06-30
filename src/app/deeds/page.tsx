
"use client";

import { useState } from 'react';
import DeedListPanel from '@/components/deed-list-panel';
import DeedEditorPanel from '@/components/deed-editor-panel';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Link from 'next/link';
import { Skull, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/deeds', label: 'Creature Deeds', group: 'Compendium' },
    { href: '/', label: 'Bestiary', group: 'Compendium' },
    { href: '/encounters', label: 'Encounters' },
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
  );
};


export default function DeedsPage() {
  const [selectedDeedId, setSelectedDeedId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const refreshList = () => setDataVersion(v => v + 1);

  return (
    <MainLayout>
      <div className="flex flex-1 overflow-hidden h-full">
          <div className="w-[380px] border-r border-border bg-card flex-col h-full hidden md:flex">
              <DeedListPanel
                  onSelectDeed={setSelectedDeedId}
                  selectedDeedId={selectedDeedId}
                  dataVersion={dataVersion}
              />
          </div>
          <div className="flex-1 overflow-y-auto bg-background/50 p-4 sm:p-6 md:p-8 h-full">
              <DeedEditorPanel
                  key={selectedDeedId ?? 'new'}
                  deedId={selectedDeedId}
                  onDeedSaveSuccess={(id) => {
                      refreshList();
                      setSelectedDeedId(id);
                  }}
                  onDeedDeleteSuccess={() => {
                      refreshList();
                      setSelectedDeedId(null);
                  }}
                  clearSelection={() => setSelectedDeedId(null)}
              />
          </div>
      </div>
    </MainLayout>
  );
}
