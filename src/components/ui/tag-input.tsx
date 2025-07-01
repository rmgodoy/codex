
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { getAllTags } from '@/lib/idb';
import { ScrollArea } from './scroll-area';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput = ({ value, onChange, placeholder }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTags() {
      const tagsFromDb = await getAllTags();
      setAllTags(tagsFromDb.map(t => t.name));
    }
    fetchTags();
  }, []);

  useEffect(() => {
    if (inputValue) {
      const filtered = allTags
        .filter(tag => tag.toLowerCase().includes(inputValue.toLowerCase()))
        .filter(tag => !value.includes(tag))
        .slice(0, 10);
      setSuggestions(filtered);
      setIsPopoverOpen(filtered.length > 0);
    } else {
      setIsPopoverOpen(false);
    }
  }, [inputValue, allTags, value]);
  
  const addTag = (tag: string) => {
    const newTag = tag.trim();
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag]);
    }
    setInputValue('');
    setIsPopoverOpen(false);
  };
  
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '') {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverAnchor asChild>
          <div className="flex w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background has-[input:focus-visible]:outline-none has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-2">
              {value.map(tag => (
                  <Badge key={tag} variant="secondary">
                  {tag}
                  <button
                      type="button"
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => removeTag(tag)}
                  >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                  </Badge>
              ))}
              <Input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="flex-1 border-0 bg-transparent p-0 text-base shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm"
              />
          </div>
        </PopoverAnchor>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <ScrollArea className="max-h-40">
          {suggestions.length > 0 && (
            <div className="p-1">
              {suggestions.map(suggestion => (
                <Button
                  key={suggestion}
                  variant="ghost"
                  className="w-full justify-start font-normal"
                  onClick={() => addTag(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
