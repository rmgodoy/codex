
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CustomCalendar } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

const monthSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Month name is required"),
  days: z.coerce.number().min(1, "Must have at least 1 day"),
});

const weekdaySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Weekday name is required"),
});

const calendarSchema = z.object({
  name: z.string().min(1, "Calendar name is required"),
  months: z.array(monthSchema).min(1, "At least one month is required"),
  weekdays: z.array(weekdaySchema).min(1, "At least one weekday is required"),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
});

type CalendarFormData = z.infer<typeof calendarSchema>;

interface CustomCalendarEditorProps {
  calendar?: CustomCalendar;
  onSave: (data: Omit<CustomCalendar, 'id'> | CustomCalendar) => void;
  onCancel: () => void;
}

export function CustomCalendarEditor({ calendar, onSave, onCancel }: CustomCalendarEditorProps) {
  const isEditingExisting = !!calendar;

  const form = useForm<CalendarFormData>({
    resolver: zodResolver(calendarSchema),
    defaultValues: calendar
      ? { ...calendar, weekdays: calendar.weekdays.map(w => ({ id: crypto.randomUUID(), name: w })) }
      : {
          name: "",
          months: [{ id: crypto.randomUUID(), name: "Month 1", days: 30 }],
          weekdays: [
            { id: crypto.randomUUID(), name: "Day 1" },
            { id: crypto.randomUUID(), name: "Day 2" },
            { id: crypto.randomUUID(), name: "Day 3" },
            { id: crypto.randomUUID(), name: "Day 4" },
            { id: crypto.randomUUID(), name: "Day 5" },
          ],
          minDate: '',
          maxDate: '',
        },
  });

  const { fields: monthFields, append: appendMonth, remove: removeMonth } = useFieldArray({
    control: form.control,
    name: "months",
  });

  const { fields: weekdayFields, append: appendWeekday, remove: removeWeekday } = useFieldArray({
    control: form.control,
    name: "weekdays",
  });
  
  const onSubmit = (data: CalendarFormData) => {
    const calendarData = {
      ...data,
      weekdays: data.weekdays.map(w => w.name),
    }
    if(calendar) {
      onSave({ ...calendar, ...calendarData });
    } else {
      onSave(calendarData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 h-full flex flex-col">
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader>
            <CardTitle>{calendar ? `Editing ${calendar.name}` : "Create New Custom Calendar"}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calendar Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <h3 className="text-lg font-medium mb-2">Months</h3>
                  <div className="space-y-2">
                    {monthFields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                        <FormField
                          control={form.control}
                          name={`months.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Month Name</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`months.${index}.days`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Days</FormLabel>
                              <FormControl><Input type="number" {...field} className="w-24" disabled={isEditingExisting} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {!isEditingExisting && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeMonth(index)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!isEditingExisting && (
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendMonth({ id: crypto.randomUUID(), name: `Month ${monthFields.length + 1}`, days: 30 })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Month
                    </Button>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Weekdays</h3>
                  <div className="space-y-2">
                    {weekdayFields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`weekdays.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl><Input {...field} placeholder={`Day ${index + 1}`} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {!isEditingExisting && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeWeekday(index)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!isEditingExisting && (
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendWeekday({ id: crypto.randomUUID(), name: "" })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Weekday
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="ml-auto">Save Calendar</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
