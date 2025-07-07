
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from 'date-fns';

import { useToast } from "@/hooks/use-toast";
import { addCalendarEvent, updateCalendarEvent, getAllCreatures, getAllFactions, addTags } from "@/lib/idb";
import type { CalendarEvent, NewCalendarEvent, Creature, Faction, CalendarPartyType } from "@/lib/types";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { TagInput } from "./ui/tag-input";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Users, User, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarPartySelectionDialog } from "./calendar-party-selection-dialog";

const eventSchema = z.object({
    title: z.string().min(1, "Title is required."),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    startDate: z.date({ required_error: "A start date is required." }),
    endDate: z.date().optional(),
}).superRefine((data, ctx) => {
    if (data.endDate && data.startDate > data.endDate) {
        ctx.addIssue({
          path: ['endDate'],
          message: 'End date cannot be before start date.',
        });
    }
});

type EventFormData = z.infer<typeof eventSchema>;

interface CalendarEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
  event?: CalendarEvent | null;
  defaultCalendarId: string;
  initialDate: Date;
}

export function CalendarEventDialog({ isOpen, onOpenChange, onSaveSuccess, event, defaultCalendarId, initialDate }: CalendarEventDialogProps) {
  const { toast } = useToast();
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [selectedParty, setSelectedParty] = useState<{ id: string; name: string; type: CalendarPartyType } | null>(null);


  useEffect(() => {
    Promise.all([getAllCreatures(), getAllFactions()]).then(([creatures, factions]) => {
      setCreatures(creatures);
      setFactions(factions);
    });
  }, []);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      startDate: new Date(),
      endDate: undefined
    }
  });
  
  const { watch } = form;
  const watchedStartDate = watch('startDate');

  useEffect(() => {
    if (event && isOpen) {
      form.reset({
        title: event.title,
        description: event.description,
        tags: event.tags || [],
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      });
      if (event.party) {
        setSelectedParty(event.party);
      } else {
        setSelectedParty(null);
      }
    } else if (!event && isOpen) {
      form.reset({
        title: "",
        description: "",
        tags: [],
        startDate: new Date(),
        endDate: undefined,
      });
      setSelectedParty(null);
    }
  }, [event, isOpen, form, initialDate]);

  const onSubmit = async (data: EventFormData) => {
    let partyToSave: CalendarEvent['party'] | undefined = undefined;

    if (selectedParty) {
        partyToSave = {
            type: selectedParty.type,
            id: selectedParty.id,
            name: selectedParty.name,
        }
    }
    
    const eventToSave: NewCalendarEvent = {
        title: data.title,
        calendarId: defaultCalendarId,
        description: data.description || '',
        startDate: data.startDate.toISOString(),
        endDate: (data.endDate || data.startDate).toISOString(),
        tags: data.tags || [],
        party: partyToSave,
    };
    
    try {
        if (data.tags) await addTags(data.tags, 'calendar');

        if (event) {
            await updateCalendarEvent({ ...eventToSave, id: event.id });
            toast({ title: 'Event Updated' });
        } else {
            await addCalendarEvent(eventToSave);
            toast({ title: 'Event Created' });
        }
        onSaveSuccess();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save event.' });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Add New Event"}</DialogTitle>
          <DialogDescription>
             {event ? `Editing event on ${format(new Date(event.startDate), 'PPP')}` : "Create a new event."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="title" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="description" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField name="startDate" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date("0001-01-01T00:00:00")} initialFocus/>
                        </PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>
                )}/>
                <FormField name="endDate" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (watchedStartDate || new Date("0001-01-01T00:00:00"))} initialFocus/>
                        </PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>
                )}/>
            </div>
            <div>
              <FormLabel>Responsible Party (Optional)</FormLabel>
              {selectedParty ? (
                <div className="flex items-center justify-between p-2 mt-2 border rounded-md">
                  <p className="font-semibold">{selectedParty.name} <span className="text-sm text-muted-foreground capitalize">({selectedParty.type})</span></p>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedParty(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <CalendarPartySelectionDialog
                    items={factions}
                    onSelectItem={(item) => setSelectedParty({ ...item, type: 'faction' })}
                    trigger={<Button type="button" variant="outline" className="w-full"><Users className="h-4 w-4 mr-2" />Select Faction</Button>}
                    title="Select a Faction"
                  />
                  <CalendarPartySelectionDialog
                    items={creatures}
                    onSelectItem={(item) => setSelectedParty({ ...item, type: 'creature' })}
                    trigger={<Button type="button" variant="outline" className="w-full"><User className="h-4 w-4 mr-2" />Select Creature</Button>}
                    title="Select a Creature"
                  />
                </div>
              )}
            </div>
             <FormField name="tags" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Tags</FormLabel><FormControl>
                    <TagInput value={field.value || []} onChange={field.onChange} tagSource="calendar" placeholder="Add tags..."/>
                </FormControl></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Event</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
