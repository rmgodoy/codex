
"use client";

import { useState } from 'react';
import type { CustomCalendar } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { CustomCalendarView } from './custom-calendar-view';

interface CustomDatePickerDialogProps {
  calendarModel: CustomCalendar;
  initialDate?: string | null;
  onDateSelect: (date: string) => void;
  children: React.ReactNode;
}

export function CustomDatePickerDialog({ calendarModel, initialDate, onDateSelect, children }: CustomDatePickerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] p-4 flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Date</DialogTitle>
        </DialogHeader>
        <CustomCalendarView
          calendar={calendarModel}
          onDateSelect={(date: Date) => {
            onDateSelect(date.toISOString());
            setIsOpen(false);
          }}
          disableEditing
          initialDate={initialDate ? new Date(initialDate) : new Date()}
          isDatePicker
        />
      </DialogContent>
    </Dialog>
  );
}


    