
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfDay } from 'date-fns';

import { useToast } from "@/hooks/use-toast";
import { addCalendarEvent, updateCalendarEvent, getAllCreatures, getAllFactions, addTags } from "@/lib/idb";
import type { CalendarEvent, NewCalendarEvent, Creature, Faction, CalendarPartyType, Calendar as CalendarType } from "@/lib/types";
import { CALENDAR_PARTY_TYPES } from "@/lib/types";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { TagInput } from "./ui/tag-input";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Calendar as CalendarIcon } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Calendar as DayPickerCalendar } from "@/components/ui/calendar";

const eventSchema = z.object({
    title: z.string().min(1, "Title is required."),
    description: z.string().optional(),
    partyType: z.enum(CALENDAR_PARTY_TYPES).optional(),
    partyId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    startDate: z.date({ required_error: "A start date is required." }),
    endDate: z.date().optional(),
}).superRefine((data, ctx) => {
    if (data.partyType && !data.partyId) {
        ctx.addIssue({
          path: ['partyId'],
          message: 'A responsible party must be selected if a party type is chosen.',
        });
      }
      if (!data.partyType && data.partyId) {
          ctx.addIssue({
            path: ['partyType'],
            message: 'Party type must be selected if a party is chosen.',
          });
        }
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
      partyType: undefined,
      partyId: undefined,
      tags: [],
      startDate: initialDate,
      endDate: undefined
    }
  });
  
  const { watch, setValue } = form;
  const watchedPartyType = watch('partyType');
  const watchedStartDate = watch('startDate');

  useEffect(() => {
    if (watchedPartyType) {
        setValue('partyId', '');
    }
  }, [watchedPartyType, setValue]);

  useEffect(() => {
    if (event && isOpen) {
      form.reset({
        title: event.title,
        description: event.description,
        partyType: event.party?.type,
        partyId: event.party?.id,
        tags: event.tags || [],
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      });
    } else if (!event && isOpen) {
      form.reset({
        title: "",
        description: "",
        partyType: undefined,
        partyId: undefined,
        tags: [],
        startDate: initialDate,
        endDate: undefined,
      });
    }
  }, [event, isOpen, form, initialDate]);

  const onSubmit = async (data: EventFormData) => {
    let partyToSave: CalendarEvent['party'] | undefined = undefined;

    if (data.partyType && data.partyId) {
        const partySource = data.partyType === 'creature' ? creatures : factions;
        const selectedParty = partySource.find(p => p.id === data.partyId);
    
        if (selectedParty) {
            partyToSave = {
                type: data.partyType,
                id: selectedParty.id,
                name: selectedParty.name,
            }
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
  
  const partyList = watch('partyType') === 'creature' ? creatures : factions;
  const selectedPartyId = watch('partyId');
  const selectedPartyName = partyList.find(p => p.id === selectedPartyId)?.name;
  
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
                            <DayPickerCalendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date("0001-01-01T00:00:00")} initialFocus/>
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
                            <DayPickerCalendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (watchedStartDate || new Date("0001-01-01T00:00:00"))} initialFocus/>
                        </PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>
                )}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField name="partyType" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Party Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {CALENDAR_PARTY_TYPES.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
                 <FormField name="partyId" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Responsible Party</FormLabel>
                        <Popover><PopoverTrigger asChild disabled={!watchedPartyType}>
                            <FormControl>
                                <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                    <span className="truncate">{selectedPartyName || "Select Party"}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <ScrollArea className="h-48">
                                {partyList.map(p => (
                                    <Button key={p.id} variant="ghost" className="w-full justify-start" onClick={() => {field.onChange(p.id); document.body.click()}}>
                                        {p.name}
                                    </Button>
                                ))}
                            </ScrollArea>
                        </PopoverContent>
                        </Popover><FormMessage/>
                    </FormItem>
                 )} />
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
