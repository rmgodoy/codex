
"use client";

import { useState, useMemo } from 'react';
import type { CustomCalendar } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

interface CustomCalendarViewProps {
  calendar: CustomCalendar;
  disableEditing?: boolean;
  initialDate?: Date;
  selectedDate?: Date;
  isDatePicker?: boolean;
  onEdit?: () => void;
  onDateSelect?: (date: Date) => void;
}

type ViewMode = 'day' | 'month' | 'year';

export function CustomCalendarView({ 
    calendar, 
    disableEditing = false, 
    initialDate, 
    selectedDate, 
    isDatePicker = false, 
    onEdit, 
    onDateSelect 
}: CustomCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = initialDate || new Date();
    let monthIndex = d.getUTCMonth();
    if (monthIndex >= calendar.months.length) {
      monthIndex = 0;
    }
    return { year: d.getUTCFullYear(), monthIndex, day: d.getUTCDate() };
  });
  const [viewMode, setViewMode] = useState<ViewMode>(isDatePicker ? 'day' : 'day');
  const [decadeStart, setDecadeStart] = useState(Math.floor((currentDate.year - 1) / 10) * 10 + 1);

  const currentMonth = useMemo(() => calendar.months[currentDate.monthIndex], [calendar.months, currentDate.monthIndex]);

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
    setCurrentDate(prev => ({ ...prev, monthIndex, day: 1 }));
    setViewMode('day');
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(prev => ({ ...prev, year }));
    setViewMode('month');
  }
  
  const handleDaySelect = (day: number) => {
    const newSelectedDate = new Date(Date.UTC(currentDate.year, currentDate.monthIndex, day));
    if (onDateSelect) {
      onDateSelect(newSelectedDate);
    }
  };


  const renderDayView = () => {
    if (!currentMonth) return null;
    
    const numCols = calendar.weekdays.length;
    const totalDays = currentMonth.days;
    const firstDay = new Date(Date.UTC(currentDate.year, currentDate.monthIndex, 1));
    const firstDayOfWeek = (firstDay.getUTCDay() % numCols); // Simple start day calculation
    
    const cells = Array(firstDayOfWeek + totalDays).fill(null);
     
    for (let i = 0; i < totalDays; i++) {
        cells[i + firstDayOfWeek] = i + 1;
    }
    
    return (
      <div className="grid flex-1 grid-cols-1" style={{gridTemplateRows: 'auto 1fr'}}>
        <div 
            style={{'--cols': numCols} as React.CSSProperties} 
            className="grid grid-cols-[repeat(var(--cols),_minmax(0,_1fr))] shrink-0"
        >
            {calendar.weekdays.map((day) => (
                <div key={day} className="text-center font-semibold text-muted-foreground p-2 text-sm">
                    {day}
                </div>
            ))}
        </div>
        <div 
            style={{'--cols': numCols} as React.CSSProperties} 
            className="grid grid-cols-[repeat(var(--cols),_minmax(0,_1fr))] grid-rows-auto flex-1"
        >
            {cells.map((day, index) => {
                 const isSelected = selectedDate ? (
                   selectedDate.getUTCFullYear() === currentDate.year &&
                   selectedDate.getUTCMonth() === currentDate.monthIndex &&
                   selectedDate.getUTCDate() === day
                 ) : false;

                 return (
                 <div
                    key={index}
                    className={cn(
                        "flex items-start justify-start p-2 rounded-lg transition-colors cursor-pointer",
                        "hover:bg-muted",
                        day && "cursor-pointer",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    onClick={() => day && handleDaySelect(day)}
                >
                    {day && <span className="text-sm">{day}</span>}
                </div>
                 )
            })}
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
    if (!currentMonth) return '...';
    if (viewMode === 'day') return `${currentMonth.name}, ${currentDate.year}`;
    if (viewMode === 'month') return `${currentDate.year}`;
    return `${decadeStart} - ${decadeStart + 9}`;
  }

  return (
    <Card className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={handlePrev}><ChevronLeft className="h-5 w-5"/></Button>
            <Button variant="ghost" className="text-xl font-bold" onClick={handleTitleClick}>{getTitle()}</Button>
            <Button variant="ghost" size="icon" onClick={handleNext}><ChevronRight className="h-5 w-5"/></Button>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'year' && renderYearView()}
        </div>
    </Card>
  );
}
