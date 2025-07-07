
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface SelectableItem {
  id: string;
  name: string;
}

interface MultiItemSelectionDialogProps {
  items: SelectableItem[];
  initialSelectedIds?: string[];
  onConfirm: (selectedIds: string[]) => void;
  trigger: React.ReactNode;
  title: string;
}

export function MultiItemSelectionDialog({ items, initialSelectedIds = [], onConfirm, trigger, title }: MultiItemSelectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };
  
  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
    setIsOpen(false);
  }

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
            <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
              <Checkbox
                id={`item-select-${item.id}`}
                checked={selectedIds.has(item.id)}
                onCheckedChange={(checked) => handleCheckboxChange(item.id, !!checked)}
              />
              <Label htmlFor={`item-select-${item.id}`} className="flex-1 font-normal cursor-pointer">
                {item.name}
              </Label>
            </div>
          ))}
        </ScrollArea>
        <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
