
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { getAllTags } from '@/lib/idb';
import { ScrollArea } from './scroll-area';
import { cn } from '@/lib/utils';

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
  const [activeIndex, setActiveIndex] = useState(-1);
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
      const hasSuggestions = filtered.length > 0;
      setIsPopoverOpen(hasSuggestions);
      setActiveIndex(hasSuggestions ? 0 : -1);
    } else {
      setIsPopoverOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }, [inputValue, allTags, value]);
  
  const addTag = (tag: string) => {
    const newTag = tag.trim();
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag]);
    }
    setInputValue('');
    setIsPopoverOpen(false);
    setActiveIndex(-1);
  };
  
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isPopoverOpen && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev >= suggestions.length - 1 ? 0 : prev + 1));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
            return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            if (activeIndex > -1) {
                e.preventDefault();
                addTag(suggestions[activeIndex]);
                return;
            }
        }
    }

    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '') {
        if (value.length > 0) {
            removeTag(value[value.length - 1]);
        }
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
              {suggestions.map((suggestion, index) => (
                <Button
                  key={suggestion}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start font-normal",
                    activeIndex === index && "bg-accent"
                  )}
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
