
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
import { Trash2, Edit, Tag, X, ArrowLeft, Plus, Dices, Upload, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { TagInput } from "./ui/tag-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

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
  dieSize: z.string().min(1, "Dice notation is required."),
  columns: z.array(randomTableColumnSchema).min(1, "At least one column is required"),
  tags: z.array(z.string()).optional(),
  concatenateResults: z.boolean().default(false),
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
  dieSize: "20",
  columns: [],
  tags: [],
  concatenateResults: false,
};

const rollSingleDie = (sides: number) => Math.floor(Math.random() * sides) + 1;

const rollDiceString = (diceString: string): { finalRoll: number, rollString: string } => {
    if (!diceString) return { finalRoll: 0, rollString: "Invalid dice string" };

    const concatenationParts = diceString.split('|');
    let finalConcatenatedString = "";
    let rollPartsStrings: string[] = [];

    for (const part of concatenationParts) {
        const additionParts = part.split('+');
        let partSum = 0;
        
        for (const term of additionParts) {
            const trimmedTerm = term.trim();
            if (trimmedTerm.includes('d')) {
                const [numDiceStr, dieSizeStr] = trimmedTerm.split('d');
                const numDice = numDiceStr ? parseInt(numDiceStr) : 1;
                const dieSize = parseInt(dieSizeStr);

                if (!isNaN(numDice) && !isNaN(dieSize) && dieSize > 0) {
                    let rolls = [];
                    for (let i = 0; i < numDice; i++) {
                        const roll = rollSingleDie(dieSize);
                        rolls.push(roll);
                        partSum += roll;
                    }
                    rollPartsStrings.push(`${numDice}d${dieSize} (${rolls.join(', ')})`);
                }
            } else if (!isNaN(parseInt(trimmedTerm))) {
                const dieSize = parseInt(trimmedTerm);
                if (dieSize > 0) {
                    const roll = rollSingleDie(dieSize);
                    partSum += roll;
                    rollPartsStrings.push(`1d${dieSize} (${roll})`);
                }
            }
        }
        finalConcatenatedString += partSum.toString();
    }
    
    return { 
        finalRoll: parseInt(finalConcatenatedString),
        rollString: `Roll: ${diceString} -> [${rollPartsStrings.join(' + ')}]` 
    };
};

const getDiceRange = (diceString: string): { min: number, max: number } | null => {
    if (!diceString || diceString.includes('|')) return null;

    // If it's just a number, treat it as 1-N
    if (!isNaN(parseInt(diceString, 10)) && !diceString.includes('d') && !diceString.includes('+')) {
        const sides = parseInt(diceString, 10);
        return { min: 1, max: sides };
    }

    let min = 0;
    let max = 0;
    
    const parts = diceString.split('+');
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('d')) {
            const [numDiceStr, dieSizeStr] = trimmed.split('d');
            const numDice = numDiceStr ? parseInt(numDiceStr, 10) : 1;
            const dieSize = parseInt(dieSizeStr, 10);
            if (!isNaN(numDice) && !isNaN(dieSize) && dieSize > 0) {
                min += numDice;
                max += numDice * dieSize;
            } else {
                return null; // Invalid dice format
            }
        } else if (!isNaN(parseInt(trimmed, 10))) {
            const constant = parseInt(trimmed, 10);
            min += constant;
            max += constant;
        } else {
            return null; // Invalid format
        }
    }
    return { min, max };
}

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

function ImportDialog({ onImport }: { onImport: (data: Partial<RandomTableFormData>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [importType, setImportType] = useState<'csv' | 'markdown' | null>(null);
  const [markdownText, setMarkdownText] = useState('');
  const { toast } = useToast();

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const headers = results.meta.fields;
          if (!headers || headers.length < 2) throw new Error("CSV must have at least two columns (range and one value column).");
          
          const rangeHeader = headers[0];
          const columnHeaders = headers.slice(1);
          
          const columns: RandomTableColumn[] = columnHeaders.map(name => ({
            id: crypto.randomUUID(),
            name,
            options: [],
          }));

          (results.data as any[]).forEach(row => {
            const range = row[rangeHeader];
            if (range) {
              columnHeaders.forEach((header, index) => {
                if (row[header]) {
                  columns[index].options.push({
                    id: crypto.randomUUID(),
                    range: range.toString(),
                    value: row[header].toString(),
                  });
                }
              });
            }
          });

          onImport({ columns });
          setIsOpen(false);
          setImportType(null);
          toast({ title: "CSV Parsed Successfully" });
        } catch (error: any) {
          toast({ variant: "destructive", title: "CSV Import Error", description: error.message });
        }
      },
      error: (error: any) => {
        toast({ variant: "destructive", title: "CSV Parsing Error", description: error.message });
      },
    });
  };

  const handleMarkdownImport = () => {
    try {
      const lines = markdownText.trim().split('\n').map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
      if (lines.length < 3) throw new Error("Markdown table must have a header, separator, and at least one data row.");

      const headers = lines[0].slice(1, -1).split('|').map(h => h.trim());
      const columnHeaders = headers.slice(1);
      
      const columns: RandomTableColumn[] = columnHeaders.map(name => ({
        id: crypto.randomUUID(),
        name,
        options: [],
      }));

      for (let i = 2; i < lines.length; i++) {
        const row = lines[i].slice(1, -1).split('|').map(c => c.trim());
        const range = row[0];
        if (range) {
          for (let j = 1; j < row.length; j++) {
            if (row[j] && j - 1 < columns.length) {
              columns[j - 1].options.push({
                id: crypto.randomUUID(),
                range: range,
                value: row[j],
              });
            }
          }
        }
      }

      onImport({ columns });
      setIsOpen(false);
      setImportType(null);
      toast({ title: "Markdown Parsed Successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Markdown Import Error", description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline"><Upload className="h-4 w-4 mr-2" /> Import</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Table Data</DialogTitle>
          <DialogDescription>Import from a CSV file or paste a Markdown table.</DialogDescription>
        </DialogHeader>
        {importType === null && (
          <div className="flex gap-4 pt-4">
            <Button className="w-full" onClick={() => setImportType('csv')}>Import CSV</Button>
            <Button className="w-full" onClick={() => setImportType('markdown')}>Import Markdown</Button>
          </div>
        )}
        {importType === 'csv' && (
          <div className="pt-4">
            <Input type="file" accept=".csv" onChange={handleCsvImport} />
            <Button variant="link" onClick={() => setImportType(null)}>Back</Button>
          </div>
        )}
        {importType === 'markdown' && (
          <div className="pt-4 space-y-2">
            <Textarea 
              rows={10} 
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder="| Range | Column 1 | Column 2 |&#10;|---|---|---|&#10;| 1-5 | Value A | Value B |"
            />
            <div className="flex justify-between">
                <Button variant="link" onClick={() => setImportType(null)}>Back</Button>
                <Button onClick={handleMarkdownImport}>Parse Markdown</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


export default function RandomTableEditorPanel({ tableId, isCreatingNew, onSaveSuccess, onDeleteSuccess, onEditCancel, onBack }: RandomTableEditorPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [loading, setLoading] = useState(!isCreatingNew && !!tableId);
  const [tableData, setTableData] = useState<RandomTable | null>(null);
  const [rollResult, setRollResult] = useState<{result: string[], roll: string} | null>(null);
  const isMobile = useIsMobile();

  const form = useForm<RandomTableFormData>({
    resolver: zodResolver(randomTableSchema),
    defaultValues: defaultValues,
  });
  
  const { control, getValues, handleSubmit, reset } = form;

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
          if (typeof tableFromDb.dieSize === 'number') {
            tableFromDb.dieSize = String(tableFromDb.dieSize);
          }
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
        const dataToReset = { ...tableData };
        if (typeof dataToReset.dieSize === 'number') {
            dataToReset.dieSize = String(dataToReset.dieSize);
        }
        form.reset(dataToReset);
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
      // After saving, we need to refetch and set the data for the view mode to be correct
      const updatedTable = await getRandomTableById(savedId);
      if (updatedTable) {
        setTableData(updatedTable);
      }
      onSaveSuccess(savedId);
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: `Could not save changes.` });
    }
  };
  
  const handleRoll = () => {
    const table = getValues();
    const columnResults: { name: string, roll: number, value: string }[] = [];
    let fullRollString = '';

    table.columns.forEach((column, index) => {
        const { finalRoll, rollString } = rollDiceString(table.dieSize);
        if (index === 0) fullRollString = rollString;

        const option = column.options.find(opt => parseRange(opt.range, finalRoll));
        columnResults.push({
            name: column.name,
            roll: finalRoll,
            value: option ? option.value : `(No result for ${finalRoll})`
        });
    });

    if (table.concatenateResults) {
        const finalString = columnResults.map(r => r.value).join(' ');
        setRollResult({result: [finalString], roll: fullRollString});
    } else {
        const resultStrings = columnResults.map(r => 
            `**${r.name}** (Rolled ${r.roll}): ${r.value}`
        );
        setRollResult({result: resultStrings, roll: fullRollString});
    }
};

  
  const handleImport = (data: Partial<RandomTableFormData>) => {
    const currentData = getValues();
    reset({ ...currentData, ...data });
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
    const diceRange = getDiceRange(tableData.dieSize);
    const hasRange = !!diceRange;
    const allOptions = tableData.columns.flatMap(c => c.options);
    const uniqueRanges = Array.from(new Set(allOptions.map(o => o.range))).sort((a, b) => {
        const aNum = parseInt(a.split('-')[0]);
        const bNum = parseInt(b.split('-')[0]);
        return aNum - bNum;
    });

    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex flex-row items-start justify-between">
              <div className="flex items-center gap-2">
                {isMobile && onBack && <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 -ml-2 -mt-1"><ArrowLeft className="h-4 w-4" /></Button>}
                <div>
                  <CardTitle className="text-3xl font-bold">{tableData.name}</CardTitle>
                  <CardDescription>Roll: {tableData.dieSize} {tableData.concatenateResults && "(Concatenated)"}</CardDescription>
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
                <h3 className="font-semibold text-lg mb-2">Roll Result</h3>
                {rollResult.result.length === 1 ? (
                    <p className="text-foreground">{rollResult.result[0]}</p>
                ) : (
                    <ul className="space-y-1">
                        {rollResult.result.map((line, index) => {
                            const parts = line.split(/(\*\*.*?\*\*)/g);
                            return (
                                <li key={index} className="text-foreground">
                                    {parts.map((part, i) => 
                                        part.startsWith('**') && part.endsWith('**') 
                                            ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong> 
                                            : part
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
                <p className="text-xs text-muted-foreground mt-2">{rollResult.roll}</p>
              </div>
            )}
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{tableData.dieSize}</TableHead>
                    {tableData.columns.map(col => <TableHead key={col.id}>{col.name}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hasRange && Array.from({ length: diceRange.max - diceRange.min + 1 }, (_, i) => i + diceRange.min).map(roll => (
                    <TableRow key={roll}>
                      <TableCell className="font-medium">{roll}</TableCell>
                      {tableData.columns.map(col => {
                        const option = col.options.find(opt => parseRange(opt.range, roll));
                        return <TableCell key={col.id}>{option ? option.value : '-'}</TableCell>
                      })}
                    </TableRow>
                  ))}
                  {!hasRange && uniqueRanges.map((range, i) => (
                     <TableRow key={`${range}-${i}`}>
                        <TableCell>{range}</TableCell>
                        {tableData.columns.map(col => {
                            const matchingOption = col.options.find(o => o.range === range);
                            return <TableCell key={col.id}>{matchingOption?.value || '-'}</TableCell>
                        })}
                     </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  {isMobile && onBack && <Button type="button" variant="ghost" size="icon" onClick={onEditCancel} className="shrink-0 -ml-2"><ArrowLeft className="h-4 w-4" /></Button>}
                  <CardTitle>{isCreatingNew ? "Create New Table" : `Editing: ${getValues("name") || "..."}`}</CardTitle>
                </div>
                {!isMobile && <Button type="button" variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField name="name" control={control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Table Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="dieSize" control={control} render={({ field }) => (<FormItem><FormLabel>Dice to Roll</FormLabel><FormControl><Input {...field} placeholder="e.g. 20, d100, 2d6+4, d6|d6" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField name="description" control={control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl></FormItem>)} />
              <FormField
                control={control}
                name="concatenateResults"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                                Concatenate results into a single string
                            </FormLabel>
                        </div>
                    </FormItem>
                )}
                />

              <FormField name="tags" control={control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />Tags</FormLabel><FormControl><TagInput value={field.value || []} onChange={field.onChange} placeholder="Add tags..." tagSource="randomTable" /></FormControl><FormMessage /></FormItem>)} />
              <Separator />
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Columns</h3>
                  <div className="flex gap-2">
                    <ImportDialog onImport={handleImport} />
                    <Button type="button" size="sm" variant="outline" onClick={() => appendColumn({ id: crypto.randomUUID(), name: `Column ${columnFields.length + 1}`, options: [] })}><Plus className="h-4 w-4 mr-2" /> Add Column</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {columnFields.map((column, colIndex) => (
                      <Collapsible key={column.id} defaultOpen={!getValues(`columns.${colIndex}.name`)} className="border p-4 rounded-md bg-muted/50">
                        <div className="flex justify-between items-center">
                          <CollapsibleTrigger asChild>
                            <button type="button" className="flex items-center gap-3 text-left w-full">
                              <ChevronsUpDown className="h-5 w-5 text-muted-foreground" />
                              <span className="text-lg font-semibold text-foreground">
                                  {getValues(`columns.${colIndex}.name`) || "New Column"}
                              </span>
                            </button>
                          </CollapsibleTrigger>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeColumn(colIndex)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <CollapsibleContent className="mt-4 space-y-3">
                           <FormField name={`columns.${colIndex}.name`} control={control} render={({ field }) => (<FormItem className="flex-1 mr-4"><FormLabel>Column Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                           <OptionsArray control={control} colIndex={colIndex} />
                        </CollapsibleContent>
                      </Collapsible>
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
