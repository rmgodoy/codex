
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import type { RandomTable, NewRandomTable, RandomTableColumn } from "@/lib/types";
import { getRandomTableById, addRandomTable, updateRandomTable, deleteRandomTable, addTags } from "@/lib/idb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Edit, Tag, X, ArrowLeft, Plus, Dices } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";

const randomTableColumnOptionSchema = z.object({
  id: z.string(),
  range: z.string().min(1, "Range is required (e.g., '1' or '1-3')"),
  value: z.string().min(1, "Value is required"),
});

const randomTableColumnSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Column name is required"),
  options: z.array(randomTableColumnOptionSchema),
});

const randomTableSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  description: z.string().optional(),
  dieSize: z.coerce.number().min(2, "Die size must be at least 2"),
  columns: z.array(randomTableColumnSchema).min(1, "At least one column is required"),
  tags: z.array(z.string()).optional(),
});

type RandomTableFormData = z.infer<typeof randomTableSchema>;

interface RandomTableEditorPanelProps {
  tableId: string | null;
  isCreatingNew: boolean;
  onSaveSuccess: (id: string) => void;
  onDeleteSuccess: () => void;
  onEditCancel: () => void;
  onBack?: () => void;
}

const defaultValues: RandomTableFormData = {
  name: "",
  description: "",
  dieSize: 20,
  columns: [],
  tags: [],
};

const rollDie = (sides: number) => Math.floor(Math.random() * sides) + 1;

const parseRange = (range: string, roll: number): boolean => {
    if (range.includes('-')) {
        const [min, max] = range.split('-').map(Number);
        if (!isNaN(min) && !isNaN(max)) {
            return roll >= min && roll <= max;
        }
    }
    const singleValue = Number(range);
    if (!isNaN(singleValue)) {
        return roll === singleValue;
    }
    return false;
};

export default function RandomTableEditorPanel({ tableId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onBack }: RandomTableEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!tableId);
  const [tableData, setTableData] = useState<RandomTable | null>(null);
  const [rollResult, setRollResult] = useState<string[] | null>(null);
  const isMobile = useIsMobile();

  const form = useForm<RandomTableFormData>({
    resolver: zodResolver(randomTableSchema),
    defaultValues: defaultValues,
  });
  
  const { control, watch, getValues, handleSubmit } = form;

  const { fields: columnFields, append: appendColumn, remove: removeColumn } = useFieldArray({
    control,
    name: "columns",
  });
  
  useEffect(() => {
    const fetchTableData = async () => {
      if (isCreatingNew) {
        form.reset(defaultValues);
        setTableData(null);
        setIsEditing(true);
        setLoading(false);
        return;
      }
      
      if (!tableId) {
        setIsEditing(false);
        setLoading(false);
        setTableData(null);
        return;
      }

      setLoading(true);
      setIsEditing(false);
      try {
        const tableFromDb = await getRandomTableById(tableId);
        if (tableFromDb) {
          form.reset(tableFromDb);
          setTableData(tableFromDb);
        } else {
          setTableData(null);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load table data." });
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [tableId, isCreatingNew, form, toast]);

  const handleCancel = () => {
    if (isCreatingNew) {
      onEditCancel();
    } else if (tableData) {
      form.reset(tableData);
      setIsEditing(false);
    }
  };

  const onSubmit = async (data: RandomTableFormData) => {
    try {
      const tableToSave: NewRandomTable | RandomTable = { ...data, tags: data.tags || [] };

      if (data.tags && data.tags.length > 0) {
        await addTags(data.tags, 'randomTable');
      }

      let savedId: string;
      if (isCreatingNew) {
        savedId = await addRandomTable(tableToSave as NewRandomTable);
        toast({ title: "Table Created!", description: `${data.name} has been added.` });
      } else if (tableId) {
        savedId = tableId;
        await updateRandomTable({ ...tableToSave, id: tableId });
        toast({ title: "Save Successful", description: `${data.name} has been updated.` });
      } else {
        return;
      }
      onSaveSuccess(savedId);
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };
  
  const handleRoll = () => {
    const table = getValues();
    const result: string[] = [];
    table.columns.forEach(column => {
        const roll = rollDie(table.dieSize);
        const option = column.options.find(opt => parseRange(opt.range, roll));
        result.push(option ? `${column.name}: ${option.value}` : `${column.name}: (No result for roll ${roll})`);
    });
    setRollResult(result);
  };

  const handleDelete = async () => {
    if (!tableId) return;
    try {
      await deleteRandomTable(tableId);
      toast({ title: "Table Deleted", description: "The random table has been removed." });
      onDeleteSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the table." });
    }
  };

  if (loading) return <div className="w-full max-w-5xl mx-auto"><Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>;
  if (!tableId && !isCreatingNew) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="h-full flex items-center justify-center min-h-[300px]"><CardContent className="text-center pt-6"><p className="text-xl text-muted-foreground">Select a table to view</p><p className="text-muted-foreground">or create a new one.</p></CardContent></Card>
      </div>
    );
  }

  if (!isEditing && tableData) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex flex-row items-start justify-between">
              <div className="flex items-center gap-2">
                {isMobile && onBack && <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 -ml-2 -mt-1"><ArrowLeft className="h-5 w-5" /></Button>}
                <div>
                  <CardTitle className="text-3xl font-bold">{tableData.name}</CardTitle>
                  <CardDescription>Roll a d{tableData.dieSize}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRoll}><Dices className="h-4 w-4 mr-2" /> Roll</Button>
                <Button variant="outline" size="sm" onClick={() => { setRollResult(null); setIsEditing(true); }}><Edit className="h-4 w-4"/><span className="hidden sm:inline ml-2">Edit</span></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {rollResult && (
              <div className="mb-4 p-4 border rounded-md bg-muted/50">
                <h3 className="font-semibold text-lg mb-2">Result:</h3>
                <p className="text-foreground">{rollResult.join(' ')}</p>
              </div>
            )}
            <div className="space-y-4">
              {tableData.columns.map(col => (
                <div key={col.id}>
                  <h4 className="font-semibold">{col.name}</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {col.options.map(opt => <li key={opt.id}>{opt.range}: {opt.value}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{tableData.name}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <CardHeader>
              <div className="flex flex-row justify-between items-start">
                <div className="flex items-center gap-2">
                  {isMobile && onBack && <Button type="button" variant="ghost" size="icon" onClick={onEditCancel} className="shrink-0 -ml-2"><ArrowLeft className="h-5 w-5" /></Button>}
                  <CardTitle>{isCreatingNew ? "Create New Table" : `Editing: ${getValues("name") || "..."}`}</CardTitle>
                </div>
                {!isMobile && <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField name="name" control={control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Table Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="dieSize" control={control} render={({ field }) => (<FormItem><FormLabel>Die Size (d#)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField name="description" control={control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl></FormItem>)} />
              <FormField name="tags" control={control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />Tags</FormLabel><FormControl><TagInput value={field.value || []} onChange={field.onChange} placeholder="Add tags..." tagSource="randomTable" /></FormControl><FormMessage /></FormItem>)} />
              <Separator />
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Columns</h3>
                  <Button type="button" size="sm" variant="outline" onClick={() => appendColumn({ id: crypto.randomUUID(), name: `Column ${columnFields.length + 1}`, options: [] })}><Plus className="h-4 w-4 mr-2" /> Add Column</Button>
                </div>
                <div className="space-y-4">
                  {columnFields.map((column, colIndex) => (
                    <div key={column.id} className="border p-4 rounded-md bg-muted/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <FormField name={`columns.${colIndex}.name`} control={control} render={({ field }) => (<FormItem className="flex-1 mr-4"><FormLabel>Column Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeColumn(colIndex)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <OptionsArray control={control} colIndex={colIndex} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center gap-2">
              {!isCreatingNew && <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{getValues("name")}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
              <div className="flex-grow" />
              {!isMobile && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
              <Button type="submit">{isCreatingNew ? "Create Table" : "Save Changes"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

function OptionsArray({ control, colIndex }: { control: any; colIndex: number }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `columns.${colIndex}.options`
  });
  return (
    <div className="space-y-2 pl-4 border-l-2">
      <h4 className="font-medium text-sm">Options</h4>
      {fields.map((option, optIndex) => (
        <div key={option.id} className="flex items-end gap-2">
          <FormField name={`columns.${colIndex}.options.${optIndex}.range`} control={control} render={({ field }) => (<FormItem><FormLabel>Range</FormLabel><FormControl><Input {...field} placeholder="e.g. 1-3" /></FormControl><FormMessage /></FormItem>)} />
          <FormField name={`columns.${colIndex}.options.${optIndex}.value`} control={control} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Value</FormLabel><FormControl><Input {...field} placeholder="e.g. Joe" /></FormControl><FormMessage /></FormItem>)} />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(optIndex)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => append({ id: crypto.randomUUID(), range: "", value: "" })}><Plus className="h-4 w-4 mr-2" /> Add Option</Button>
    </div>
  );
}
