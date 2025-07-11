
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, isSameDay, isWithinInterval, startOfDay, eachDayOfInterval } from "date-fns";
import Calendar from 'react-calendar';

import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarEventDialog } from "@/components/calendar-event-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Cog, Plus, Check, X, MapPin } from "lucide-react";
import { getAllCalendarEvents, deleteCalendarEvent } from "@/lib/idb/calendarEvents";
import { getAllCalendars, addCalendar, updateCalendar, deleteCalendarAndEvents, getAllCustomCalendars } from "@/lib/idb";
import type { CalendarEvent, Calendar as CalendarType, NewCalendar, CustomCalendar as CustomCalendarType, CustomDate } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CustomCalendarView } from "@/components/custom-calendar-view";

interface CustomDate {
    year: number;
    monthIndex: number;
    day: number;
}

function CalendarManagementDialog({ calendars, customCalendars, onCalendarsUpdate }: { calendars: CalendarType[], customCalendars: CustomCalendarType[], onCalendarsUpdate: (newCalendarId?: string) => void }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCalendarName, setNewCalendarName] = useState("");
    const [newCalendarModelId, setNewCalendarModelId] = useState("traditional");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const { toast } = useToast();

    const handleAddCalendar = async () => {
        if (!newCalendarName.trim()) return;
        try {
            const calendarData: NewCalendar = { 
                name: newCalendarName.trim(),
                modelId: newCalendarModelId === 'traditional' ? undefined : newCalendarModelId
            };
            const newId = await addCalendar(calendarData);
            toast({ title: 'Calendar Created', description: `"${newCalendarName}" has been added.` });
            setNewCalendarName("");
            setNewCalendarModelId("traditional");
            onCalendarsUpdate(newId);
            setIsDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create calendar.' });
        }
    };
    
    const handleStartEdit = (calendar: CalendarType) => {
        setEditingId(calendar.id);
        setEditingName(calendar.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName("");
    };

    const handleRenameCalendar = async () => {
        if (!editingId || !editingName.trim()) return;
        const calendarToUpdate = calendars.find(c => c.id === editingId);
        if (!calendarToUpdate) return;
        try {
            await updateCalendar({ ...calendarToUpdate, name: editingName.trim() });
            toast({ title: 'Calendar Renamed' });
            onCalendarsUpdate();
            handleCancelEdit();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename calendar.' });
        }
    };


    const handleDeleteCalendar = async (calendarId: string) => {
        try {
            await deleteCalendarAndEvents(calendarId);
            toast({ title: 'Calendar Deleted' });
            onCalendarsUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete calendar and its events.' });
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Cog className="h-5 w-5" /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Calendars</DialogTitle>
                    <DialogDescription>Add, rename, or delete your calendars.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex flex-col gap-2 p-3 border rounded-md">
                        <Input 
                            placeholder="New calendar name..." 
                            value={newCalendarName}
                            onChange={(e) => setNewCalendarName(e.target.value)}
                        />
                        <Select value={newCalendarModelId} onValueChange={setNewCalendarModelId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="traditional">Traditional Calendar</SelectItem>
                                {customCalendars.map(cal => (
                                    <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddCalendar} disabled={!newCalendarName.trim()}><Plus className="h-4 w-4" /> Add</Button>
                    </div>
                    <Separator />
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {calendars.map(cal => (
                            <div key={cal.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 gap-2">
                                {editingId === cal.id ? (
                                    <>
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCalendar() }}
                                            className="h-8"
                                            autoFocus
                                        />
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" className="h-7 w-7" onClick={handleRenameCalendar} aria-label="Save">
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEdit} aria-label="Cancel">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1 truncate" title={cal.name}>{cal.name}</span>
                                        <div className="flex items-center shrink-0">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(cal)} aria-label="Edit">
                                                <Edit className="h-4 w-4"/>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete the "{cal.name}" calendar and all of its events.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteCalendar(cal.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const customDateToDate = (customDate: CustomDate): Date => {
    return new Date(Date.UTC(customDate.year, customDate.monthIndex, customDate.day));
};

const dateToCustomDate = (date: Date): CustomDate => ({
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
    day: date.getUTCDate()
});

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [customCalendars, setCustomCalendars] = useState<CustomCalendarType[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  
  const [selectedCustomDate, setSelectedCustomDate] = useState<CustomDate | null>(null);

  const [activeMonth, setActiveMonth] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  const activeCalendar = useMemo(() => {
    return calendars.find(c => c.id === selectedCalendarId);
  }, [calendars, selectedCalendarId]);

  const activeCalendarModel = useMemo(() => {
    if (!activeCalendar || !activeCalendar.modelId) return null;
    return customCalendars.find(cm => cm.id === activeCalendar.modelId) || null;
  }, [activeCalendar, customCalendars]);
  
  const isCustomCalendar = !!activeCalendarModel;
  
  const getDefaultCustomDate = (model: CustomCalendarType | null): CustomDate => {
    if (model?.minDate) {
        return dateToCustomDate(new Date(model.minDate));
    }
    return { year: 1, monthIndex: 0, day: 1 };
  };

  const fetchCalendarsAndEvents = async (calendarId: string | null) => {
    try {
      const [allCalendars, allCustomCalendars] = await Promise.all([
        getAllCalendars(),
        getAllCustomCalendars(),
      ]);
       setCustomCalendars(allCustomCalendars);

       if (allCalendars.length === 0) {
            const defaultCalendarId = await addCalendar({ name: "Default", modelId: undefined });
            const defaultCalendars = [{ id: defaultCalendarId, name: "Default" }];
            setCalendars(defaultCalendars);
            setSelectedCalendarId(defaultCalendarId);
            setEvents([]);
            setSelectedCustomDate(dateToCustomDate(new Date(Date.UTC(1, 0, 1))));
            return;
       } 
       
       let finalCalendarId = calendarId;
       if (finalCalendarId === null || !allCalendars.some(c => c.id === finalCalendarId)) {
           finalCalendarId = allCalendars[0]?.id || null;
       }
       setCalendars(allCalendars);

       // Do this before setting selected ID to avoid re-triggering this effect
       if (selectedCalendarId === finalCalendarId) return;
       setSelectedCalendarId(finalCalendarId);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load calendar data.' });
    }
  };
  
  useEffect(() => {
    fetchCalendarsAndEvents(selectedCalendarId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCalendarSelection = (newId: string) => {
    setSelectedCalendarId(newId);
    setSelectedCustomDate(null);
  }

  useEffect(() => {
    const loadEventsAndSetDate = async () => {
        if (!selectedCalendarId) {
            setEvents([]);
            return;
        }

        const allEvents = await getAllCalendarEvents(selectedCalendarId);
        setEvents(allEvents);

        const currentModel = customCalendars.find(cm => cm.id === calendars.find(c => c.id === selectedCalendarId)?.modelId) || null;
        
        if (selectedCustomDate) return;
        
        let newDate: CustomDate;
        if (allEvents.length > 0) {
            const sortedEvents = [...allEvents].sort((a,b) => customDateToDate(a.startDate).getTime() - customDateToDate(b.startDate).getTime());
            newDate = sortedEvents[0].startDate;
        } else {
            newDate = getDefaultCustomDate(currentModel);
        }
        setSelectedCustomDate(newDate);
    }
    loadEventsAndSetDate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCalendarId]);

  useEffect(() => {
    if (!isCustomCalendar && selectedCustomDate) {
        setActiveMonth(customDateToDate(selectedCustomDate));
    }
  }, [selectedCustomDate, isCustomCalendar]);

  const refreshData = async (newCalendarId?: string) => {
    if (newCalendarId) {
      await fetchCalendarsAndEvents(newCalendarId);
    } else {
      if (selectedCalendarId) {
        const events = await getAllCalendarEvents(selectedCalendarId);
        setEvents(events);
      }
    }
  };
  
  const handleSaveSuccess = () => {
    if (selectedCalendarId) {
      getAllCalendarEvents(selectedCalendarId).then(setEvents);
    }
    setIsDialogOpen(false);
    setEditingEvent(null);
  };
  
  const handleEditEvent = (event: CalendarEvent) => {
      setEditingEvent(event);
      setIsDialogOpen(true);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    try {
        await deleteCalendarEvent(eventId);
        toast({ title: 'Event Deleted' });
        if (selectedCalendarId) {
            getAllCalendarEvents(selectedCalendarId).then(setEvents);
        }
    } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete event.' });
    }
  }

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedCustomDate) return [];
    return events.filter(event => {
      const start = event.startDate;
      const end = event.endDate;
      const selected = customDateToDate(selectedCustomDate);
      const startDate = customDateToDate(start);
      const endDate = customDateToDate(end);
      return isWithinInterval(selected, { start: startDate, end: endDate });
    }).sort((a,b) => a.startDate.day - b.startDate.day);
  }, [events, selectedCustomDate]);
  
  const eventDays = useMemo(() => {
    return events.flatMap(event => {
      const startDate = customDateToDate(event.startDate);
      const endDate = customDateToDate(event.endDate);
      return eachDayOfInterval({
        start: startOfDay(startDate), 
        end: startOfDay(endDate)
      });
    });
  }, [events]);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedCustomDate) return '...';
    const dateForDisplay = customDateToDate(selectedCustomDate);
    if (isCustomCalendar && activeCalendarModel) {
        const { year, monthIndex, day } = selectedCustomDate;
        if (monthIndex >= activeCalendarModel.months.length) return `...`;
        const monthName = activeCalendarModel.months[monthIndex]?.name || `Month ${monthIndex + 1}`;
        return `${monthName} ${day}, ${year}`;
    }
    return format(dateForDisplay, 'PPP');
  }, [selectedCustomDate, activeCalendarModel, isCustomCalendar]);

  const initialDialogDate = useMemo(() => {
    return selectedCustomDate || getDefaultCustomDate(activeCalendarModel);
  }, [selectedCustomDate, activeCalendarModel]);

  return (
    <>
    <SidebarProvider>
        <MainLayout>
            <div className="flex w-full h-full overflow-hidden">
                <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
                    <div className="p-4 space-y-4 h-full flex flex-col">
                        <div className="flex items-center gap-2">
                            <Select value={selectedCalendarId || ''} onValueChange={handleCalendarSelection}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select a calendar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {calendars.map(cal => <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <CalendarManagementDialog calendars={calendars} customCalendars={customCalendars} onCalendarsUpdate={refreshData} />
                        </div>
                        <Button onClick={() => { setEditingEvent(null); setIsDialogOpen(true); }}>Add Event</Button>
                        <Separator />
                        <Card className="flex-1 flex flex-col min-h-0">
                            <CardHeader>
                                <CardTitle>Events for {formattedSelectedDate}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0">
                                <ScrollArea className="h-full">
                                    {eventsForSelectedDay.length > 0 ? (
                                    <div className="space-y-4 pr-4">
                                        {eventsForSelectedDay.map(event => (
                                        <Card key={event.id} className="bg-card-foreground/5">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-lg">{event.title}</CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditEvent(event)}><Edit className="h-4 w-4"/></Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>This will permanently delete "{event.title}".</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <CardDescription className="text-xs">
                                                    From: {event.startDate.day}/{event.startDate.monthIndex+1}/{event.startDate.year} To: {event.endDate.day}/{event.endDate.monthIndex+1}/{event.endDate.year}
                                                </CardDescription>
                                                {event.description && <p className="text-sm mt-2">{event.description}</p>}
                                                {event.party && <p className="text-xs text-muted-foreground mt-2">Party: <span className="font-semibold text-accent">{event.party.name} ({event.party.type})</span></p>}
                                                {event.location && (
                                                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> Location set
                                                    </p>
                                                )}
                                                {event.tags && event.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {event.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                        ))}
                                    </div>
                                    ) : (
                                    <p className="text-muted-foreground text-center py-8">No events for this day.</p>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </Sidebar>
                <SidebarInset className="flex-1 flex flex-col overflow-hidden bg-background/50 p-4">
                     {isCustomCalendar && activeCalendarModel ? (
                        <CustomCalendarView
                          calendar={activeCalendarModel}
                          disableEditing
                          initialDate={selectedCustomDate}
                          selectedDate={selectedCustomDate}
                          onDateSelect={setSelectedCustomDate}
                          events={events}
                        />
                    ) : (
                        <Calendar
                            onChange={(value) => {
                                if (value instanceof Date) {
                                    setSelectedCustomDate(dateToCustomDate(value));
                                }
                            }}
                            value={selectedCustomDate ? customDateToDate(selectedCustomDate) : undefined}
                            activeStartDate={activeMonth}
                            onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setActiveMonth(activeStartDate)}
                            minDate={new Date(Date.UTC(1,0,1))}
                            maxDate={new Date(Date.UTC(9999, 11, 31))}
                            tileContent={({ date, view }) => {
                                if (view === 'month') {
                                    const hasEvent = eventDays.some(eventDay => isSameDay(eventDay, date));
                                    return hasEvent ? <div className="event-dot"></div> : null;
                                }
                                return null;
                            }}
                            className="w-full h-full"
                            weekStartsOn={1}
                            next2Label={null}
                            prev2Label={null}
                        />
                    )}
                </SidebarInset>
            </div>
        </MainLayout>
        <CalendarEventDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSaveSuccess={handleSaveSuccess}
            event={editingEvent}
            calendar={activeCalendar}
            calendarModel={activeCalendarModel}
            initialDate={initialDialogDate}
        />
    </SidebarProvider>
    </>
  );
}
