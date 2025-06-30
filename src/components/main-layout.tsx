
'use client';

import Link from 'next/link';
import { Skull, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useMemo } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const pageTitle = useMemo(() => {
    switch (pathname) {
      case '/':
        return 'Tresspasser Bestiary';
      case '/deeds':
        return 'Tresspasser Deeds';
      case '/encounters':
        return 'Tresspasser Encounters';
      default:
        return 'Tresspasser Bestiary';
    }
  }, [pathname]);

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
    <div className="flex flex-col h-screen" style={{'width': '100%'}}>
      <header className="py-4 px-6 md:px-8 border-b border-border flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {(pathname === '/' || pathname === '/deeds' || pathname === '/encounters') && <SidebarTrigger />}
          <Link href="/" className="flex items-center gap-3">
            <Skull className="text-primary h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary-foreground">{pageTitle}</h1>
          </Link>
          <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
          <nav className="hidden md:flex items-center gap-1">
            {desktopNav}
          </nav>
        </div>
        <div className="md:hidden">
          {mobileNav}
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
