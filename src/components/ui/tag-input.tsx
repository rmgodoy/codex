

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { getTagsBySource, getTopTagsBySource } from '@/lib/idb';
import { ScrollArea } from './scroll-area';
import { cn } from '@/lib/utils';
import type { TagSource } from '@/lib/types';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  tagSource: TagSource;
}

export const TagInput = ({ value, onChange, placeholder, tagSource }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTags() {
      if (tagSource) {
        const tagsFromDb = await getTagsBySource(tagSource);
        setAllTags(tagsFromDb.map(t => t.name));
      }
    }
    fetchTags();
  }, [tagSource]);

  const refreshTopSuggestions = async (currentTags: string[]) => {
    const tagsToFetch = 3 + currentTags.length;
    const topTags = await getTopTagsBySource(tagSource, tagsToFetch);
    const filteredTopTags = topTags.filter(t => !currentTags.includes(t)).slice(0, 3);
    
    if (filteredTopTags.length > 0) {
      setSuggestions(filteredTopTags);
      setIsPopoverOpen(true);
      setActiveIndex(0);
    } else {
      setSuggestions([]);
      setIsPopoverOpen(false);
    }
  };

  const addTag = async (tag: string) => {
    const newTag = tag.trim();
    let updatedTags = value;
    if (newTag && !value.includes(newTag)) {
      updatedTags = [...value, newTag];
      onChange(updatedTags);
    }
    setInputValue('');
    await refreshTopSuggestions(updatedTags);
  };
  
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
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
                await addTag(suggestions[activeIndex]);
                return;
            }
        }
    }

    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      await addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '') {
        if (value.length > 0) {
            onChange(value.slice(0, -1));
        }
    }
  };
  
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);

    if (newInputValue) {
      const filtered = allTags
        .filter(tag => tag.toLowerCase().includes(newInputValue.toLowerCase()))
        .filter(tag => !value.includes(tag))
        .slice(0, 10);
      setSuggestions(filtered);
      setIsPopoverOpen(filtered.length > 0);
      setActiveIndex(filtered.length > 0 ? 0 : -1);
    } else {
        await refreshTopSuggestions(value);
    }
  };

  const handleFocus = async () => {
    if (!inputValue) {
      await refreshTopSuggestions(value);
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
                      onClick={() => {
                        onChange(value.filter(t => t !== tag));
                        inputRef.current?.focus();
                      }}
                  >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                  </Badge>
              ))}
              <Input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
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
                  onMouseDown={async (e) => {
                    e.preventDefault();
                    await addTag(suggestion);
                  }}
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
