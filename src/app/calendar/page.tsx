
"use client";

import { useState, useEffect } from "react";
import { format, isSameDay, isWithinInterval } from "date-fns";
import type { DateRange } from "react-day-picker";
import MainLayout from "@/components/main-layout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarEventDialog } from "@/components/calendar-event-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit } from "lucide-react";
import { getAllCalendarEvents, deleteCalendarEvent } from "@/lib/idb";
import type { CalendarEvent } from "@/lib/types";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      const allEvents = await getAllCalendarEvents();
      setEvents(allEvents);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load calendar events.' });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSaveSuccess = () => {
    fetchEvents();
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
        fetchEvents();
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
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-shrink-0 mx-auto">
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
          <div className="flex-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Events for {format(selectedDate, 'PPP')}</CardTitle>
                        <CardDescription>All scheduled events for this day.</CardDescription>
                    </div>
                    <Button onClick={() => { setEditingEvent(null); setIsDialogOpen(true); }}>Add Event</Button>
                </div>
              </CardHeader>
              <CardContent>
                {eventsForSelectedDay.length > 0 ? (
                  <div className="space-y-4">
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
      />
    </MainLayout>
  );
}
