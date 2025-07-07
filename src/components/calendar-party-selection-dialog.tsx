"use client";

import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import type { Faction, Creature } from '@/lib/types';

type SelectableItem = Pick<Faction, 'id' | 'name'> | Pick<Creature, 'id' | 'name'>;

interface CalendarPartySelectionDialogProps {
  items: SelectableItem[];
  onSelectItem: (item: SelectableItem) => void;
  trigger: React.ReactNode;
  title: string;
}

export function CalendarPartySelectionDialog({ items, onSelectItem, trigger, title }: CalendarPartySelectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm]);

  const handleSelect = (item: SelectableItem) => {
    onSelectItem(item);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md h-[60vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="mb-4 shrink-0"
        />
        <ScrollArea className="flex-1 border rounded-md p-2">
          {filteredItems.map(item => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleSelect(item)}
            >
              {item.name}
            </Button>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
