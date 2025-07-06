
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
    <MainLayout showSidebarTrigger={false}>
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                    <SelectTrigger className="w-[200px]">
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
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex justify-center lg:justify-start">
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
          </div>
          <div className="w-full lg:w-2/5">
            <Card>
              <CardHeader>
                <CardTitle>Events for {format(selectedDate, 'PPP')}</CardTitle>
                <CardDescription>All scheduled events for this day.</CardDescription>
              </CardHeader>
              <CardContent>
                {eventsForSelectedDay.length > 0 ? (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {eventsForSelectedDay.map(event => (
                      <Card key={event.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{event.title}</CardTitle>
                                    <CardDescription>
                                        From: {format(new Date(event.startDate), 'PPP')} To: {format(new Date(event.endDate), 'PPP')}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditEvent(event)}><Edit className="h-4 w-4"/></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
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
                            <p className="text-sm mb-2">{event.description}</p>
                            <p className="text-xs text-muted-foreground">Party: <span className="font-semibold text-accent">{event.party.name} ({event.party.type})</span></p>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <CalendarEventDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSaveSuccess={handleSaveSuccess}
        event={editingEvent}
        selectedDate={selectedDate}
        calendars={calendars}
        defaultCalendarId={selectedCalendarId === 'all' ? (calendars[0]?.id || '') : selectedCalendarId}
      />
    </MainLayout>
  );
}
