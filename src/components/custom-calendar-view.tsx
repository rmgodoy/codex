
"use client";

import { useState, useMemo } from 'react';
import type { CustomCalendar } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

interface CustomCalendarViewProps {
  calendar: CustomCalendar;
  disableEditing?: boolean;
  initialDate?: Date;
  isDatePicker?: boolean;
  onEdit?: () => void;
  onDateSelect?: (date: Date) => void;
}

type ViewMode = 'day' | 'month' | 'year';

export function CustomCalendarView({ calendar, disableEditing = false, initialDate, isDatePicker = false, onEdit, onDateSelect }: CustomCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = initialDate || new Date();
    let monthIndex = d.getMonth();
    // Ensure the initial month index is valid for the given calendar model.
    if (monthIndex >= calendar.months.length) {
      monthIndex = 0;
    }
    return { year: d.getFullYear(), monthIndex, day: d.getDate() };
  });
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [decadeStart, setDecadeStart] = useState(Math.floor((currentDate.year - 1) / 10) * 10 + 1);

  const currentMonth = calendar.months[currentDate.monthIndex];

  const handlePrev = () => {
    if (viewMode === 'day') {
      setCurrentDate(prev => {
        let newMonthIndex = prev.monthIndex - 1;
        let newYear = prev.year;
        if (newMonthIndex < 0) {
          newMonthIndex = calendar.months.length - 1;
          newYear -= 1;
        }
        return { ...prev, year: newYear, monthIndex: newMonthIndex };
      });
    } else if (viewMode === 'month') {
        setCurrentDate(prev => ({ ...prev, year: prev.year - 1}));
    } else { // year
        setDecadeStart(prev => prev - 10);
    }
  };

  const handleNext = () => {
     if (viewMode === 'day') {
        setCurrentDate(prev => {
            let newMonthIndex = prev.monthIndex + 1;
            let newYear = prev.year;
            if (newMonthIndex >= calendar.months.length) {
                newMonthIndex = 0;
                newYear += 1;
            }
            return { ...prev, year: newYear, monthIndex: newMonthIndex };
        });
    } else if (viewMode === 'month') {
        setCurrentDate(prev => ({ ...prev, year: prev.year + 1}));
    } else { // year
        setDecadeStart(prev => prev + 10);
    }
  };

  const handleTitleClick = () => {
    if (viewMode === 'day') setViewMode('month');
    else if (viewMode === 'month') {
        setDecadeStart(Math.floor((currentDate.year - 1) / 10) * 10 + 1);
        setViewMode('year');
    }
  };
  
  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(prev => ({ ...prev, monthIndex }));
    setViewMode('day');
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(prev => ({ ...prev, year }));
    setViewMode('month');
  }
  
  const handleDaySelect = (day: number) => {
    if (isDatePicker && onDateSelect) {
      const selectedDate = new Date(currentDate.year, currentDate.monthIndex, day);
      onDateSelect(selectedDate);
    }
  };


  const renderDayView = () => {
    const numCols = calendar.weekdays.length;
    const totalDays = currentMonth.days;
    const numRows = Math.ceil(totalDays / numCols);

    const dayGrid = Array.from({ length: numRows * numCols }, (_, i) => {
        const day = i + 1;
        return day <= totalDays ? day : null;
    });

    return (
      <div className="flex flex-col flex-1">
        <div 
            style={{'--cols': numCols} as React.CSSProperties} 
            className="grid grid-cols-[repeat(var(--cols),_minmax(0,_1fr))] shrink-0"
        >
            {calendar.weekdays.map((day) => (
                <div key={day} className="text-center font-bold text-muted-foreground p-2 text-sm border-b border-r border-border">
                    {day}
                </div>
            ))}
        </div>
        <div 
            style={{'--cols': numCols, '--rows': numRows} as React.CSSProperties} 
            className="grid grid-cols-[repeat(var(--cols),_minmax(0,_1fr))] grid-rows-[repeat(var(--rows),_minmax(auto,_1fr))] flex-1"
        >
            {dayGrid.map((day, index) => (
                <div 
                    key={index} 
                    className={cn("p-2 border-b border-r border-border", isDatePicker && day && "cursor-pointer hover:bg-accent")}
                    onClick={() => day && handleDaySelect(day)}
                >
                    {day && <span className="text-sm">{day}</span>}
                </div>
            ))}
        </div>
    </div>
    );
  };
  
  const renderMonthView = () => (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-4 flex-1">
        {calendar.months.map((month, index) => (
            <Button key={month.name} variant="outline" className="h-24 text-lg" onClick={() => handleMonthSelect(index)}>
                {month.name}
            </Button>
        ))}
    </div>
  );

  const renderYearView = () => {
    const years = Array.from({length: 10}, (_, i) => decadeStart + i);
    return (
        <div className="grid grid-cols-4 md:grid-cols-5 gap-4 p-4 flex-1">
            {years.map(year => (
                <Button key={year} variant="outline" className="h-24 text-lg" onClick={() => handleYearSelect(year)}>
                    {year}
                </Button>
            ))}
        </div>
    );
  };

  const getTitle = () => {
    if (viewMode === 'day') return `${currentMonth.name}, ${currentDate.year}`;
    if (viewMode === 'month') return `${currentDate.year}`;
    return `${decadeStart} - ${decadeStart + 9}`;
  }

  return (
    <Card className="h-full flex flex-col">
        {!isDatePicker && (
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-2xl font-bold">{calendar.name}</h2>
                {!disableEditing && onEdit && (
                    <Button variant="ghost" size="sm" onClick={onEdit}><Edit className="h-4 w-4 mr-2" />Edit Model</Button>
                )}
            </div>
        )}
        <div className="flex items-center justify-between p-4 border-b">
            <Button variant="ghost" size="icon" onClick={handlePrev}><ChevronLeft /></Button>
            <Button variant="ghost" className="text-xl font-bold" onClick={handleTitleClick}>{getTitle()}</Button>
            <Button variant="ghost" size="icon" onClick={handleNext}><ChevronRight /></Button>
        </div>
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'year' && renderYearView()}
    </Card>
  );
}
