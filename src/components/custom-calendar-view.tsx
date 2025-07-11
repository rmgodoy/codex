
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { CustomCalendar, CalendarEvent, CustomDate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';

const dateToCustomDate = (date: Date): CustomDate => ({
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
    day: date.getUTCDate()
});

const isSameCustomDay = (d1?: CustomDate | null, d2?: CustomDate | null) => {
    if (!d1 || !d2) return false;
    return d1.year === d2.year && d1.monthIndex === d2.monthIndex && d1.day === d2.day;
}

const isDateInRange = (date: CustomDate, start: CustomDate, end: CustomDate) => {
    // This is a simplified comparison that works for year/month/day objects
    const dateNum = date.year * 10000 + date.monthIndex * 100 + date.day;
    const startNum = start.year * 10000 + start.monthIndex * 100 + start.day;
    const endNum = end.year * 10000 + end.monthIndex * 100 + end.day;
    return dateNum >= startNum && dateNum <= endNum;
}

const customDateToKey = (date: CustomDate) => `${date.year}-${date.monthIndex}-${date.day}`;

interface CustomCalendarViewProps {
  calendar: CustomCalendar;
  disableEditing?: boolean;
  initialDate?: CustomDate | null;
  selectedDate?: CustomDate | null;
  events?: CalendarEvent[];
  onEdit?: () => void;
  onDateSelect?: (date: CustomDate) => void;
}

type ViewMode = 'day' | 'month' | 'year';


export function CustomCalendarView({ 
    calendar, 
    disableEditing = false, 
    initialDate, 
    selectedDate, 
    events = [],
    onEdit, 
    onDateSelect 
}: CustomCalendarViewProps) {
    
  const getInitialCustomDate = (): CustomDate => {
    if (initialDate) {
      let monthIndex = initialDate.monthIndex;
      if (monthIndex >= calendar.months.length) {
          monthIndex = 0;
      }
      return { year: initialDate.year, monthIndex, day: initialDate.day };
    }
    if(calendar.minDate) {
        const d = new Date(0);
        d.setUTCFullYear(parseInt(calendar.minDate.substring(0,4)), parseInt(calendar.minDate.substring(5,7)) - 1, parseInt(calendar.minDate.substring(8,10)));
        d.setUTCHours(0,0,0,0);
        return dateToCustomDate(d);
    }
    return { year: 1, monthIndex: 0, day: 1 };
  };
    
  const [currentDate, setCurrentDate] = useState<CustomDate>(getInitialCustomDate());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [decadeStart, setDecadeStart] = useState(0);
  const [isYearInputOpen, setIsYearInputOpen] = useState(false);
  const [yearInputValue, setYearInputValue] = useState('');

  useEffect(() => {
    if (currentDate) {
      setDecadeStart(Math.floor((currentDate.year - 1) / 10) * 10 + 1);
      setYearInputValue(currentDate.year.toString());
    }
  }, [currentDate]);

  useEffect(() => {
    if (selectedDate) {
        setCurrentDate({ year: selectedDate.year, monthIndex: selectedDate.monthIndex, day: selectedDate.day });
    }
  }, [selectedDate]);

  const currentMonth = useMemo(() => {
    if (!calendar || !currentDate) return null;
    return calendar.months[currentDate.monthIndex]
  }, [calendar, currentDate]);

  const eventDaysSet = useMemo(() => {
    const daySet = new Set<string>();
    events.forEach(event => {
        const start = event.startDate;
        const end = event.endDate;
        const totalMonths = calendar.months.length;
        
        let currentYear = start.year;
        let currentMonthIndex = start.monthIndex;
        let currentDay = start.day;

        while(true) {
            const dateKey = customDateToKey({year: currentYear, monthIndex: currentMonthIndex, day: currentDay});
            daySet.add(dateKey);

            if(currentYear === end.year && currentMonthIndex === end.monthIndex && currentDay === end.day) {
                break;
            }

            currentDay++;
            const daysInMonth = calendar.months[currentMonthIndex]?.days || 30;
            if (currentDay > daysInMonth) {
                currentDay = 1;
                currentMonthIndex++;
                if (currentMonthIndex >= totalMonths) {
                    currentMonthIndex = 0;
                    currentYear++;
                }
            }
        }
    });
    return daySet;
  }, [events, calendar.months]);

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
    } else if (viewMode === 'year') {
        setYearInputValue(currentDate.year.toString());
        setIsYearInputOpen(true);
    }
  };

  const handleYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newYear = parseInt(yearInputValue, 10);
    if (!isNaN(newYear)) {
      setCurrentDate(prev => ({ ...prev, year: newYear }));
      setViewMode('month');
      setIsYearInputOpen(false);
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
    const newSelectedDate = { year: currentDate.year, monthIndex: currentDate.monthIndex, day };
    if (onDateSelect) {
      onDateSelect(newSelectedDate);
    }
  };


  const renderDayView = () => {
    if (!currentMonth) return null;
    
    const numCols = calendar.weekdays.length;
    const totalDays = currentMonth.days;
    const firstDayOfMonth = { year: currentDate.year, monthIndex: currentDate.monthIndex, day: 1 };
    
    // Simplified weekday calculation - assumes a continuous cycle
    // A more complex implementation would need a reference epoch date
    const epochYear = calendar.minDate ? parseInt(calendar.minDate.substring(0,4)) : 1;
    let totalDaysSinceEpoch = 0;
    for(let y = epochYear; y < firstDayOfMonth.year; y++) {
        totalDaysSinceEpoch += calendar.months.reduce((sum, m) => sum + m.days, 0);
    }
    for(let m = 0; m < firstDayOfMonth.monthIndex; m++) {
        totalDaysSinceEpoch += calendar.months[m].days;
    }

    const firstDayOfWeek = (totalDaysSinceEpoch % numCols); 
    
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
            className="grid grid-cols-[repeat(var(--cols),_minmax(0,_1fr))] grid-rows-auto flex-1 gap-2"
        >
            {cells.map((day, index) => {
                 if (!day) {
                    return <div key={index}></div>;
                 }
                 const dayDate = { year: currentDate.year, monthIndex: currentDate.monthIndex, day: day };

                 const isSelected = isSameCustomDay(selectedDate, dayDate);
                 
                 const eventKey = customDateToKey(dayDate);
                 const hasEvent = eventDaysSet.has(eventKey);

                 return (
                 <button
                    key={index}
                    className={cn(
                        "flex items-start justify-start p-2 rounded-lg transition-colors relative",
                        "hover:bg-muted",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    onClick={() => handleDaySelect(day)}
                    disabled={!onDateSelect}
                >
                    <span className="text-sm">{day}</span>
                    {hasEvent && <div className={cn("absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full", isSelected ? 'bg-primary-foreground' : 'bg-accent')}></div>}
                </button>
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
    if (!currentMonth || !currentDate) return '...';
    if (viewMode === 'day') return `${currentMonth.name}, ${currentDate.year}`;
    if (viewMode === 'month') return `${currentDate.year}`;
    return `${decadeStart} - ${decadeStart + 9}`;
  }

  return (
    <Card className="h-full flex flex-col p-4">
        {!disableEditing && (
            <div className="flex justify-end mb-2">
                <Button variant="outline" size="sm" onClick={onEdit}>Edit Model</Button>
            </div>
        )}
        <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={handlePrev}><ChevronLeft className="h-5 w-5"/></Button>
            {isYearInputOpen ? (
                <form onSubmit={handleYearSubmit} className="flex-1 px-4">
                    <Input
                        type="number"
                        value={yearInputValue}
                        onChange={(e) => setYearInputValue(e.target.value)}
                        onBlur={() => setIsYearInputOpen(false)}
                        className="text-center text-xl font-bold h-10"
                        autoFocus
                    />
                </form>
            ) : (
                <Button variant="ghost" className="text-xl font-bold" onClick={handleTitleClick}>{getTitle()}</Button>
            )}
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
