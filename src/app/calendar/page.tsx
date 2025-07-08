
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, isSameDay, isWithinInterval, startOfDay, eachDayOfInterval } from "date-fns";
import { DateRange } from "react-day-picker";
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
import { getAllCalendars, addCalendar, updateCalendar, deleteCalendarAndEvents } from "@/lib/idb/calendars";
import type { CalendarEvent, Calendar as CalendarType, NewCalendar } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function CalendarManagementDialog({ calendars, onCalendarsUpdate }: { calendars: CalendarType[], onCalendarsUpdate: (newCalendarId?: string) => void }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCalendarName, setNewCalendarName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const { toast } = useToast();

    const handleAddCalendar = async () => {
        if (!newCalendarName.trim()) return;
        try {
            const newId = await addCalendar({ name: newCalendarName.trim() });
            toast({ title: 'Calendar Created', description: `"${newCalendarName}" has been added.` });
            setNewCalendarName("");
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
        try {
            await updateCalendar({ id: editingId, name: editingName.trim() });
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
                    <div className="flex items-center gap-2">
                        <Input 
                            placeholder="New calendar name..." 
                            value={newCalendarName}
                            onChange={(e) => setNewCalendarName(e.target.value)}
                        />
                        <Button onClick={handleAddCalendar} disabled={!newCalendarName.trim()}><Plus className="h-4 w-4" /> Add</Button>
                    </div>
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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  const fetchCalendarsAndEvents = async (calendarId: string) => {
    try {
      const allCalendars = await getAllCalendars();
       if (allCalendars.length === 0) {
            const defaultCalendarId = await addCalendar({ name: "Default" });
            const defaultCalendars = [{ id: defaultCalendarId, name: "Default" }];
            setCalendars(defaultCalendars);
            setSelectedCalendarId(defaultCalendarId);
            setEvents([]);
            const yearOne = new Date('0001-01-01T00:00:00');
            setSelectedDate(yearOne);
            setMonth(yearOne);
            return;
       } 
       setCalendars(allCalendars);
       
       let finalCalendarId = calendarId;
       if (!allCalendars.find(c => c.id === calendarId) && calendarId !== 'all') {
           finalCalendarId = 'all';
           setSelectedCalendarId('all');
       }

      const allEvents = await getAllCalendarEvents(finalCalendarId);
      setEvents(allEvents);
      
      if (allEvents.length > 0) {
        const sortedEvents = [...allEvents].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        const firstEventDate = startOfDay(new Date(sortedEvents[0].startDate));
        setSelectedDate(firstEventDate);
        setMonth(firstEventDate);
      } else {
        const yearOne = new Date('0001-01-01T00:00:00');
        setSelectedDate(yearOne);
        setMonth(yearOne);
      }

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load calendar data.' });
    }
  };
  
  const refreshData = (newCalendarId?: string) => {
      if (newCalendarId) {
        setSelectedCalendarId(newCalendarId);
      } else {
        fetchCalendarsAndEvents(selectedCalendarId);
      }
  };

  useEffect(() => {
    fetchCalendarsAndEvents(selectedCalendarId);
  }, [selectedCalendarId]);

  const handleSaveSuccess = () => {
    refreshData();
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
        refreshData();
    } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete event.' });
    }
  }

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(event =>
      isWithinInterval(selectedDate, { start: startOfDay(new Date(event.startDate)), end: startOfDay(new Date(event.endDate)) })
    ).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, selectedDate]);
  
  const eventDays = useMemo(() => {
    return events.flatMap(event => 
      eachDayOfInterval({ 
        start: startOfDay(new Date(event.startDate)), 
        end: startOfDay(new Date(event.endDate)) 
      })
    );
  }, [events]);

  return (
    <>
    <SidebarProvider>
        <MainLayout>
            <div className="flex w-full h-full overflow-hidden">
                <Sidebar style={{ "--sidebar-width": "380px" } as React.CSSProperties}>
                    <div className="p-4 space-y-4 h-full flex flex-col">
                        <div className="flex items-center gap-2">
                            <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select a calendar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Calendars</SelectItem>
                                    {calendars.map(cal => <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <CalendarManagementDialog calendars={calendars} onCalendarsUpdate={refreshData} />
                        </div>
                        <Button onClick={() => { setEditingEvent(null); setIsDialogOpen(true); }}>Add Event</Button>
                        <Separator />
                        <Card className="flex-1 flex flex-col min-h-0">
                            <CardHeader>
                                <CardTitle>Events for {selectedDate ? format(selectedDate, 'PPP') : '...'}</CardTitle>
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
                                                    From: {format(new Date(event.startDate), 'P')} To: {format(new Date(event.endDate), 'P')}
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
                <SidebarInset className="flex-1 flex flex-col overflow-hidden bg-background/50">
                    <Calendar
                        onChange={(value) => {
                            if (value instanceof Date) {
                                setSelectedDate(value);
                            }
                        }}
                        value={selectedDate}
                        activeStartDate={month}
                        onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setMonth(activeStartDate)}
                        minDate={new Date('0001-01-01T00:00:00')}
                        maxDate={new Date(new Date().getFullYear() + 100, 11, 31)}
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
                </SidebarInset>
            </div>
        </MainLayout>
        <CalendarEventDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSaveSuccess={handleSaveSuccess}
            event={editingEvent}
            defaultCalendarId={selectedCalendarId === 'all' ? (calendars[0]?.id || '') : selectedCalendarId}
            initialDate={selectedDate || new Date()}
        />
    </SidebarProvider>
    </>
  );
}
