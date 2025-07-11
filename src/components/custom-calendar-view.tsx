
"use client";

import { useState, useMemo } from 'react';
import type { CustomCalendar } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

interface CustomCalendarViewProps {
  calendar: CustomCalendar;
  onEdit: () => void;
}

type ViewMode = 'day' | 'month' | 'year';

export function CustomCalendarView({ calendar, onEdit }: CustomCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState({ year: 1, monthIndex: 0 });
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
        return { year: newYear, monthIndex: newMonthIndex };
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
            return { year: newYear, monthIndex: newMonthIndex };
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

  const calendarGrid = useMemo(() => {
    const daysInMonth = currentMonth.days;
    // For simplicity, we're not calculating the real start day of the week.
    // In a real scenario, we'd need to know the weekday of Year 1, Day 1.
    const firstDayOffset = 0;
    
    const days = [];
    for (let i = 0; i < firstDayOffset; i++) {
        days.push({ day: null, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, isCurrentMonth: true });
    }
    
    return days;
  }, [currentDate, calendar]);

  const renderDayView = () => {
    const numCols = calendar.weekdays.length;
    return (
        <div 
          style={{'--cols': numCols} as React.CSSProperties} 
          className="grid grid-cols-[repeat(var(--cols),_minmax(0,_1fr))] border-t border-l border-border flex-1"
        >
            {calendar.weekdays.map((day, index) => (
                <div key={day} className={cn("text-center font-bold text-muted-foreground p-2 text-sm bg-card border-b border-r border-border", index === 0 && "border-l-0")}>
                    {day}
                </div>
            ))}
            {calendarGrid.map((dayInfo, index) => (
                <div 
                  key={index} 
                  className={cn("p-2 bg-card h-28 border-b border-r border-border", (index + numCols) % numCols === 0 && "border-l-0")}
                >
                    {dayInfo.isCurrentMonth && <span className="text-sm">{dayInfo.day}</span>}
                </div>
            ))}
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
        <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-2xl font-bold">{calendar.name}</h2>
            <Button variant="ghost" size="sm" onClick={onEdit}><Edit className="h-4 w-4 mr-2" />Edit Structure</Button>
        </div>
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
