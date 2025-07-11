
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from 'date-fns';

import { useToast } from "@/hooks/use-toast";
import { addCalendarEvent, updateCalendarEvent, getAllCreatures, getAllFactions, addTags, getAllMaps, getAllNpcs } from "@/lib/idb";
import type { CalendarEvent, NewCalendarEvent, Creature, Faction, CalendarPartyType, Map as WorldMap, Hex, Npc, CustomCalendar, Calendar as CalendarType, CustomDate } from "@/lib/types";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { TagInput } from "./ui/tag-input";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Users, User, X, MapPin } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarPartySelectionDialog } from "./calendar-party-selection-dialog";
import { LocationPickerDialog } from "./location-picker-dialog";
import { ScrollArea } from "./ui/scroll-area";
import { CustomDatePickerDialog } from "./custom-date-picker-dialog";

const getYearOne = () => {
    const date = new Date(0);
    date.setUTCFullYear(1, 0, 1);
    date.setUTCHours(0,0,0,0);
    return date;
};

const dateToCustomDate = (date: Date): CustomDate => ({
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
    day: date.getUTCDate()
});

const customDateToDate = (customDate: CustomDate): Date => {
    const d = new Date(0);
    d.setUTCFullYear(customDate.year, customDate.monthIndex, customDate.day);
    d.setUTCHours(0,0,0,0);
    return d;
};

const customDateSchema = z.object({
  year: z.number(),
  monthIndex: z.number(),
  day: z.number(),
});

const eventSchema = z.object({
    title: z.string().min(1, "Title is required."),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    startDate: customDateSchema,
    endDate: customDateSchema.optional(),
    location: z.object({
        mapId: z.string(),
        hex: z.object({
            q: z.number(),
            r: z.number(),
            s: z.number(),
        })
    }).optional(),
}).superRefine((data, ctx) => {
    if(data.endDate) {
        const start = customDateToDate(data.startDate);
        const end = customDateToDate(data.endDate);
        if(start > end) {
            ctx.addIssue({ path: ['endDate'], message: 'End date cannot be before start date.' });
        }
    }
});

type EventFormData = z.infer<typeof eventSchema>;

interface CalendarEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
  event?: CalendarEvent | null;
  calendar: CalendarType | undefined;
  calendarModel: CustomCalendar | null;
  initialDate: { traditional?: Date, custom?: CustomDate };
}

export function CalendarEventDialog({ isOpen, onOpenChange, onSaveSuccess, event, calendar, calendarModel, initialDate }: CalendarEventDialogProps) {
  const { toast } = useToast();
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [allMaps, setAllMaps] = useState<WorldMap[]>([]);
  const [selectedParty, setSelectedParty] = useState<{ id: string; name: string; type: CalendarPartyType } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ mapId: string; mapName: string; hex: Hex } | null>(null);

  useEffect(() => {
    Promise.all([getAllCreatures(), getAllFactions(), getAllMaps(), getAllNpcs()]).then(([creatures, factions, maps, npcs]) => {
      setCreatures(creatures);
      setFactions(factions);
      setAllMaps(maps);
      setNpcs(npcs);
    });
  }, []);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });
  
  const { watch, setValue } = form;
  const watchedStartDate = watch('startDate');

  useEffect(() => {
    if (isOpen) {
        const isCustom = !!calendarModel;
        if (event) {
            form.reset({
                title: event.title,
                description: event.description,
                tags: event.tags || [],
                startDate: event.startDate,
                endDate: event.endDate,
                location: event.location,
            });
            setSelectedParty(event.party || null);
            if (event.location && allMaps.length > 0) {
                const mapName = allMaps.find(m => m.id === event.location!.mapId)?.name || 'Unknown Map';
                setSelectedLocation({ ...event.location, mapName });
            } else {
                setSelectedLocation(null);
            }
        } else {
            form.reset({
                title: "",
                description: "",
                tags: [],
                startDate: isCustom ? initialDate.custom : dateToCustomDate(initialDate.traditional || getYearOne()),
                endDate: undefined,
                location: undefined,
            });
            setSelectedParty(null);
            setSelectedLocation(null);
        }
    }
  }, [event, isOpen, form, initialDate, allMaps, calendarModel]);
  
  const onSubmit = async (data: EventFormData) => {
    let partyToSave: CalendarEvent['party'] | undefined = undefined;

    if (selectedParty) {
        partyToSave = {
            type: selectedParty.type,
            id: selectedParty.id,
            name: selectedParty.name,
        }
    }
    
    if (!calendar) {
        toast({ variant: 'destructive', title: 'Error', description: 'No calendar selected to add the event to.' });
        return;
    }

    const eventToSave: NewCalendarEvent = {
        title: data.title,
        calendarId: calendar.id,
        description: data.description || '',
        startDate: data.startDate,
        endDate: data.endDate || data.startDate,
        tags: data.tags || [],
        party: partyToSave,
        location: selectedLocation ? { mapId: selectedLocation.mapId, hex: selectedLocation.hex } : undefined,
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
      <DialogContent className="max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{event ? "Edit Event" : "Add New Event"}</DialogTitle>
          <DialogDescription>
             {event ? `Editing event.` : "Create a new event."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
            <Form {...form}>
            <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
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
                            {calendarModel ? (
                                <CustomDatePickerDialog
                                    calendarModel={calendarModel}
                                    onDateSelect={(date) => field.onChange(date)}
                                    initialDate={field.value}
                                >
                                    <Button type="button" variant="outline" className="w-full pl-3 text-left font-normal">
                                        <span>{field.value ? `${calendarModel.months[field.value.monthIndex].name} ${field.value.day}, ${field.value.year}` : "Pick a date"}</span>
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </CustomDatePickerDialog>
                            ) : (
                                <Popover><PopoverTrigger asChild>
                                    <FormControl>
                                        <Button type="button" variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(customDateToDate(field.value), "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={customDateToDate(field.value)} onSelect={(d) => d && field.onChange(dateToCustomDate(d))} defaultMonth={customDateToDate(field.value)} disabled={(date) => date < getYearOne()} initialFocus/>
                                </PopoverContent>
                                </Popover>
                            )}
                             <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField name="endDate" control={form.control} render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>End Date (Optional)</FormLabel>
                             {calendarModel ? (
                                <CustomDatePickerDialog
                                    calendarModel={calendarModel}
                                    onDateSelect={(date) => field.onChange(date)}
                                    initialDate={field.value}
                                >
                                    <Button type="button" variant="outline" className="w-full pl-3 text-left font-normal">
                                        <span>{field.value ? `${calendarModel.months[field.value.monthIndex].name} ${field.value.day}, ${field.value.year}` : "Pick a date"}</span>
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </CustomDatePickerDialog>
                            ) : (
                                <Popover><PopoverTrigger asChild>
                                    <FormControl>
                                        <Button type="button" variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(customDateToDate(field.value), "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value ? customDateToDate(field.value) : undefined} onSelect={(d) => d && field.onChange(dateToCustomDate(d))} defaultMonth={customDateToDate(field.value || watchedStartDate)} disabled={(date) => date < (customDateToDate(watchedStartDate) || getYearOne())} initialFocus/>
                                </PopoverContent>
                                </Popover>
                            )}
                            <FormMessage />
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
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <CalendarPartySelectionDialog
                        items={factions}
                        onSelectItem={(item) => setSelectedParty({ ...item, type: 'faction' })}
                        trigger={<Button type="button" variant="outline" className="w-full"><Users className="h-4 w-4 mr-2" />Faction</Button>}
                        title="Select a Faction"
                      />
                      <CalendarPartySelectionDialog
                        items={creatures}
                        onSelectItem={(item) => setSelectedParty({ ...item, type: 'creature' })}
                        trigger={<Button type="button" variant="outline" className="w-full"><User className="h-4 w-4 mr-2" />Creature</Button>}
                        title="Select a Creature"
                      />
                      <CalendarPartySelectionDialog
                        items={npcs}
                        onSelectItem={(item) => setSelectedParty({ ...item, type: 'npc' })}
                        trigger={<Button type="button" variant="outline" className="w-full"><User className="h-4 w-4 mr-2" />NPC</Button>}
                        title="Select an NPC"
                      />
                    </div>
                  )}
                </div>
                 <div>
                    <FormLabel>Location (Optional)</FormLabel>
                    {selectedLocation ? (
                    <div className="flex items-center justify-between p-2 mt-2 border rounded-md">
                        <p className="font-semibold text-sm">
                        <span className="text-muted-foreground">Map:</span> {selectedLocation.mapName} 
                        <span className="text-muted-foreground ml-2">Tile:</span> Q:{selectedLocation.hex.q}, R:{selectedLocation.hex.r}
                        </p>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedLocation(null)}>
                        <X className="h-4 w-4" />
                        </Button>
                    </div>
                    ) : (
                    <LocationPickerDialog onLocationSelect={({mapId, hex}) => {
                        const mapName = allMaps.find(m => m.id === mapId)?.name || 'Unknown Map';
                        setSelectedLocation({mapId, mapName, hex});
                    }}>
                        <Button type="button" variant="outline" className="w-full mt-2">
                            <MapPin className="h-4 w-4 mr-2" /> Select Location on Map
                        </Button>
                    </LocationPickerDialog>
                    )}
                </div>
                 <FormField name="tags" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Tags</FormLabel><FormControl>
                        <TagInput value={field.value || []} onChange={field.onChange} tagSource="calendar" placeholder="Add tags..."/>
                    </FormControl></FormItem>
                )} />
            </form>
            </Form>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="event-form">Save Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
