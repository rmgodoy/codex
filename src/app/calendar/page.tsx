
"use client";

import { useState, useEffect } from "react";
import { format, isSameDay, isWithinInterval } from "date-fns";
import MainLayout from "@/components/main-layout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarEventDialog } from "@/components/calendar-event-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Cog, Plus } from "lucide-react";
import { getAllCalendarEvents, deleteCalendarEvent } from "@/lib/idb/calendarEvents";
import { getAllCalendars, addCalendar, updateCalendar, deleteCalendarAndEvents } from "@/lib/idb/calendars";
import type { CalendarEvent, Calendar as CalendarType, NewCalendar } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function CalendarManagementDialog({ calendars, onCalendarsUpdate }: { calendars: CalendarType[], onCalendarsUpdate: () => void }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCalendarName, setNewCalendarName] = useState("");
    const { toast } = useToast();

    const handleAddCalendar = async () => {
        if (!newCalendarName.trim()) return;
        try {
            await addCalendar({ name: newCalendarName.trim() });
            toast({ title: 'Calendar Created', description: `"${newCalendarName}" has been added.` });
            setNewCalendarName("");
            onCalendarsUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create calendar.' });
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
                            <div key={cal.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <span>{cal.name}</span>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive"/></Button>
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  const fetchCalendarsAndEvents = async () => {
    try {
      const [allCalendars, allEvents] = await Promise.all([
        getAllCalendars(),
        getAllCalendarEvents(selectedCalendarId)
      ]);
       if (allCalendars.length === 0) {
            const defaultCalendarId = await addCalendar({ name: "Default" });
            setCalendars([{ id: defaultCalendarId, name: "Default" }]);
            setSelectedCalendarId(defaultCalendarId);
        } else {
            setCalendars(allCalendars);
            if (!allCalendars.find(c => c.id === selectedCalendarId) && selectedCalendarId !== 'all') {
                setSelectedCalendarId('all');
            }
        }
      setEvents(allEvents);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load calendar data.' });
    }
  };
  
  const refreshData = () => {
      fetchCalendarsAndEvents();
  };

  useEffect(() => {
    fetchCalendarsAndEvents();
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

  const eventsForSelectedDay = events.filter(event =>
    isWithinInterval(selectedDate, { start: new Date(event.startDate), end: new Date(event.endDate) }) ||
    isSameDay(selectedDate, new Date(event.startDate))
  ).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const eventDays = events.map(event => ({ from: new Date(event.startDate), to: new Date(event.endDate) }));

  return (
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
                        <Card className="flex-1 flex flex-col">
                            <CardHeader>
                                <CardTitle>Events for {format(selectedDate, 'PPP')}</CardTitle>
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
                                                <p className="text-xs text-muted-foreground mt-2">Party: <span className="font-semibold text-accent">{event.party.name} ({event.party.type})</span></p>
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
                <SidebarInset className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-8">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => setSelectedDate(date || new Date())}
                        className="rounded-md border"
                        modifiers={{ events: eventDays }}
                        modifiersClassNames={{
                            events: 'bg-primary/20 text-primary-foreground rounded-full'
                        }}
                    />
                </SidebarInset>
            </div>
        </MainLayout>
        <CalendarEventDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSaveSuccess={handleSaveSuccess}
            event={editingEvent}
            selectedDate={selectedDate}
            calendars={calendars}
            defaultCalendarId={selectedCalendarId === 'all' ? (calendars[0]?.id || '') : selectedCalendarId}
        />
    </SidebarProvider>
  );
}
