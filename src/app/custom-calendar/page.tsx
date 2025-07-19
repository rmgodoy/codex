
"use client";

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/main-layout';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomCalendarEditor } from '@/components/custom-calendar-editor';
import { CustomCalendarView } from '@/components/custom-calendar-view';
import type { CustomCalendar as CustomCalendarType } from '@/lib/types';
import { getAllCustomCalendars, addCustomCalendar, updateCustomCalendar, deleteCustomCalendarAndRelatedCalendars } from '@/lib/idb/customCalendars';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

function CalendarModelManager({ calendars, onSelect, onNew, onDelete, selectedCalendarId }: { calendars: CustomCalendarType[], onSelect: (id: string) => void, onNew: () => void, onDelete: (id: string) => void, selectedCalendarId: string | null }) {
    return (
        <div className="p-4 space-y-4 h-full flex flex-col">
            <Button onClick={onNew} className="w-full"><PlusCircle /> New Model</Button>
            <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2">
                    {calendars.map(cal => (
                        <div key={cal.id} className="flex group items-center justify-between rounded-md hover:bg-muted/50 transition-colors">
                             <Button 
                                variant="ghost" 
                                className={`flex-1 justify-start text-left h-auto py-2 ${selectedCalendarId === cal.id ? 'font-bold text-accent' : ''}`}
                                onClick={() => onSelect(cal.id)}
                            >
                                {cal.name}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete the "{cal.name}" model. All calendars using this model, and all of their events, will also be deleted. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(cal.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export default function CalendarModelsPage() {
    const [calendars, setCalendars] = useState<CustomCalendarType[]>([]);
    const [selectedCalendar, setSelectedCalendar] = useState<CustomCalendarType | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const isMobile = useIsMobile();
    const { toast } = useToast();

    const fetchCalendars = useCallback(async () => {
        const cals = await getAllCustomCalendars();
        setCalendars(cals);
        if (cals.length > 0 && !selectedCalendar && !isCreatingNew) {
            setSelectedCalendar(cals[0]);
        } else if (cals.length === 0) {
            setSelectedCalendar(null);
        }
    }, [selectedCalendar, isCreatingNew]);

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
            toast({ title: 'Calendar Model Updated' });
            setSelectedCalendar(calendarData);
        } else {
            const newId = await addCustomCalendar(calendarData);
            toast({ title: 'Calendar Model Created' });
            const newCal = { ...calendarData, id: newId };
            setSelectedCalendar(newCal);
        }
        setIsCreatingNew(false);
        fetchCalendars();
    };

    const handleDelete = async (id: string) => {
        await deleteCustomCalendarAndRelatedCalendars(id);
        toast({ title: 'Calendar Model Deleted' });
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
            return <CustomCalendarEditor onSave={handleSave} onCancel={handleCancel} calendar={selectedCalendar ?? undefined} />;
        }
        if (selectedCalendar) {
            return <CustomCalendarView key={selectedCalendar.id} calendar={selectedCalendar} onEdit={() => {
                setSelectedCalendar(selectedCalendar);
                setIsCreatingNew(true);
            }} />;
        }
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select a calendar model or create a new one to begin.</p>
            </div>
        );
    };

    return (
        <SidebarProvider>
            <MainLayout>
                <div className="flex w-full h-full overflow-hidden">
                    <Sidebar style={{ "--sidebar-width": "300px" } as React.CSSProperties}>
                        <CalendarModelManager
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
