
"use client";

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/main-layout';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomCalendarEditor } from '@/components/custom-calendar-editor';
import { CustomCalendarView } from '@/components/custom-calendar-view';
import type { CustomCalendar as CustomCalendarType } from '@/lib/types';
import { getAllCustomCalendars, addCustomCalendar, updateCustomCalendar, deleteCustomCalendar } from '@/lib/idb/customCalendars';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

function CalendarManager({ calendars, onSelect, onNew, onDelete, selectedCalendarId }: { calendars: CustomCalendarType[], onSelect: (id: string) => void, onNew: () => void, onDelete: (id: string) => void, selectedCalendarId: string | null }) {
    return (
        <div className="p-4 space-y-4">
            <Button onClick={onNew} className="w-full"><PlusCircle /> New Calendar</Button>
            {calendars.length > 0 && (
                <div className="space-y-2">
                    <Select value={selectedCalendarId ?? ''} onValueChange={onSelect}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a calendar..." />
                        </SelectTrigger>
                        <SelectContent>
                            {calendars.map(cal => (
                                <SelectItem key={cal.id} value={cal.id}>
                                    {cal.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedCalendarId && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="w-full"><Trash2 className="h-4 w-4 mr-2" />Delete Selected</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete the selected calendar. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(selectedCalendarId)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            )}
        </div>
    );
}

export default function CustomCalendarPage() {
    const [calendars, setCalendars] = useState<CustomCalendarType[]>([]);
    const [selectedCalendar, setSelectedCalendar] = useState<CustomCalendarType | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const isMobile = useIsMobile();
    const { toast } = useToast();

    const fetchCalendars = useCallback(async () => {
        const cals = await getAllCustomCalendars();
        setCalendars(cals);
        if (!selectedCalendar && cals.length > 0) {
            setSelectedCalendar(cals[0]);
        } else if (cals.length === 0) {
            setSelectedCalendar(null);
        }
    }, [selectedCalendar]);

    useEffect(() => {
        fetchCalendars();
    }, [fetchCalendars]);

    const handleSelectCalendar = (id: string) => {
        const cal = calendars.find(c => c.id === id);
        if (cal) {
            setSelectedCalendar(cal);
            setIsCreatingNew(false);
        }
    };

    const handleNewCalendar = () => {
        setSelectedCalendar(null);
        setIsCreatingNew(true);
    };

    const handleSave = async (calendarData: Omit<CustomCalendarType, 'id'> | CustomCalendarType) => {
        if ('id' in calendarData) {
            await updateCustomCalendar(calendarData);
            toast({ title: 'Calendar Updated' });
        } else {
            const newId = await addCustomCalendar(calendarData);
            toast({ title: 'Calendar Created' });
            const newCal = { ...calendarData, id: newId };
            setSelectedCalendar(newCal);
        }
        setIsCreatingNew(false);
        fetchCalendars();
    };

    const handleDelete = async (id: string) => {
        await deleteCustomCalendar(id);
        toast({ title: 'Calendar Deleted' });
        setSelectedCalendar(null);
        fetchCalendars();
    };

    const handleCancel = () => {
        setIsCreatingNew(false);
        if (calendars.length > 0) {
            setSelectedCalendar(calendars[0]);
        } else {
            setSelectedCalendar(null);
        }
    }

    const MainContent = () => {
        if (isCreatingNew) {
            return <CustomCalendarEditor onSave={handleSave} onCancel={handleCancel} />;
        }
        if (selectedCalendar) {
            return <CustomCalendarView key={selectedCalendar.id} calendar={selectedCalendar} onEdit={() => setIsCreatingNew(true)} />;
        }
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select a calendar or create a new one to begin.</p>
            </div>
        );
    };

    return (
        <SidebarProvider>
            <MainLayout>
                <div className="flex w-full h-full overflow-hidden">
                    <Sidebar style={{ "--sidebar-width": "300px" } as React.CSSProperties}>
                        <CalendarManager
                            calendars={calendars}
                            onSelect={handleSelectCalendar}
                            onNew={handleNewCalendar}
                            onDelete={handleDelete}
                            selectedCalendarId={selectedCalendar?.id ?? null}
                        />
                    </Sidebar>
                    <SidebarInset className="flex-1 overflow-y-auto bg-background/50">
                        <div className="p-4 sm:p-6 md:p-8 w-full h-full">
                           <MainContent />
                        </div>
                    </SidebarInset>
                </div>
            </MainLayout>
        </SidebarProvider>
    );
}
