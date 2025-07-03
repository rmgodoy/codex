

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Dungeon, Room as RoomType, Encounter, Treasure, AlchemicalItem } from "@/lib/types";
import { getAllRooms, getEncounterById, getAllTreasures, getAllAlchemicalItems, getCreatureById } from "@/lib/idb";
import LiveEncounterView from "./live-encounter-view";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Bot, Gem, FlaskConical, ArrowLeft, Plus, Minus, Swords } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";


interface LiveDungeonViewProps {
  dungeon: Dungeon;
  onEndDungeon: () => void;
}

type DungeonDetails = {
    rooms: Map<string, RoomType>;
    encounters: Map<string, Encounter>;
    treasures: Map<string, Treasure>;
    alchemicalItems: Map<string, AlchemicalItem>;
};

export default function LiveDungeonView({ dungeon, onEndDungeon }: LiveDungeonViewProps) {
    const [loading, setLoading] = useState(true);
    const [runningEncounter, setRunningEncounter] = useState<Encounter | null>(null);
    const [details, setDetails] = useState<DungeonDetails | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);

    const [totalActions, setTotalActions] = useState(0);
    const [alertHistory, setAlertHistory] = useState<number[]>([0]);
    
    const { toast } = useToast();

    const round = Math.floor(totalActions / 3) + 1;
    const actionInRound = (totalActions % 3) + 1;
    const currentAlert = alertHistory[totalActions] ?? 0;

    const handleAlertChange = (delta: number) => {
        const newAlert = Math.max(0, Math.min(10, currentAlert + delta));
        const newHistory = [...alertHistory];
        newHistory[totalActions] = newAlert;
        setAlertHistory(newHistory);
    };

    const handleNextAction = () => {
        setTotalActions(prevTotal => {
            const nextTotal = prevTotal + 1;
            setAlertHistory(prevHistory => {
                const newHistory = [...prevHistory];
                if (nextTotal >= newHistory.length) {
                    newHistory[nextTotal] = newHistory[prevTotal] ?? 0;
                }
                return newHistory;
            });
            return nextTotal;
        });
    };

    const handlePrevAction = () => {
        setTotalActions(prevTotal => Math.max(0, prevTotal - 1));
    };

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const roomIds = dungeon.rooms.map(r => r.roomId);
            const rooms = await getAllRooms();
            const roomsMap = new Map(rooms.map(r => [r.id, r]));
            
            const encounterIds = rooms.flatMap(r => r.features.flatMap(f => f.encounterIds));
            const encounters = await Promise.all(encounterIds.map(id => getEncounterById(id)));

            const treasureIds = rooms.flatMap(r => r.features.flatMap(f => f.treasureIds));
            const treasures = await getAllTreasures();
            
            const alchemicalItemIds = rooms.flatMap(r => r.features.flatMap(f => f.alchemicalItemIds));
            const alchemicalItems = await getAllAlchemicalItems();

            setDetails({
                rooms: roomsMap,
                encounters: new Map(encounters.filter(Boolean).map(e => [e!.id, e!])),
                treasures: new Map(treasures.map(t => [t.id, t])),
                alchemicalItems: new Map(alchemicalItems.map(a => [a.id, a]))
            });
            setLoading(false);
        };
        fetchDetails();
    }, [dungeon]);
    
    const selectedRoom = useMemo(() => {
        if (!selectedRoomId || !details) return null;
        const dungeonRoom = dungeon.rooms.find(r => r.instanceId === selectedRoomId);
        return dungeonRoom ? details.rooms.get(dungeonRoom.roomId) : null;
    }, [selectedRoomId, dungeon, details]);

    const selectedEncounter = useMemo(() => {
        if (!selectedEncounterId || !details) return null;
        return details.encounters.get(selectedEncounterId) || null;
    }, [selectedEncounterId, details]);


    const handleRunEncounter = async (encounterId: string) => {
        const encounterData = details?.encounters.get(encounterId);
        if (encounterData) {
            setRunningEncounter(encounterData);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find encounter data.' });
        }
    };
    
    if (runningEncounter) {
        return <LiveEncounterView encounter={runningEncounter} onEndEncounter={() => setRunningEncounter(null)} />;
    }

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Skeleton className="h-48 w-48" /></div>;
    }

    return (
        <div className="flex flex-col h-screen w-full bg-background/50">
            <header className="py-4 px-6 border-b border-border flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
                <h1 className="text-xl md:text-3xl font-bold text-primary-foreground">{dungeon.name}</h1>
                <div className="flex items-center gap-4">
                     <div className="text-center">
                        <div className="text-xs text-muted-foreground">Alert</div>
                        <div className="text-lg font-bold flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAlertChange(-1)} disabled={currentAlert <= 0}><Minus className="h-4 w-4"/></Button>
                            {currentAlert}
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAlertChange(1)} disabled={currentAlert >= 10}><Plus className="h-4 w-4"/></Button>
                        </div>
                    </div>
                     <div className="text-center">
                        <div className="text-xs text-muted-foreground">Round / Action</div>
                        <div className="text-lg font-bold">{round} / {actionInRound}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrevAction} disabled={totalActions === 0}>Prev Action</Button>
                        <Button variant="default" size="sm" onClick={handleNextAction}>Next Action</Button>
                    </div>
                    <Button variant="destructive" onClick={onEndDungeon}>End Dungeon</Button>
                </div>
            </header>
            <div className="flex flex-1 min-h-0">
                {(selectedRoom || selectedEncounter) && (
                     <div className="w-[380px] border-r border-border bg-card p-4 flex flex-col">
                        <Button variant="ghost" className="self-start mb-2 -ml-2" onClick={() => { setSelectedRoomId(null); setSelectedEncounterId(null); }}><ArrowLeft className="h-4 w-4 mr-2"/> Back to Dungeon View</Button>
                        <ScrollArea className="flex-1">
                            {selectedRoom && !selectedEncounter && (
                                <Card>
                                    <CardHeader><CardTitle>{selectedRoom.name}</CardTitle><CardDescription>{selectedRoom.size}</CardDescription></CardHeader>
                                    <CardContent className="space-y-4">
                                        <p>{selectedRoom.description}</p>
                                        <Separator/>
                                        <div>
                                            <h4 className="font-semibold mb-2">Features</h4>
                                            {selectedRoom.features.map(feature => (
                                                <div key={feature.id} className="p-2 border-b">
                                                    <p className="font-bold">{feature.title}</p>
                                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                                    {feature.encounterIds.map(id => <Button key={id} variant="link" className="p-0 h-auto text-accent" onClick={() => setSelectedEncounterId(id)}><Bot className="h-4 w-4 mr-1"/>{details?.encounters.get(id)?.name}</Button>)}
                                                    {feature.treasureIds.map(id => <p key={id} className="text-sm flex items-center gap-1"><Gem className="h-4 w-4"/>{details?.treasures.get(id)?.name}</p>)}
                                                    {feature.alchemicalItemIds.map(id => <p key={id} className="text-sm flex items-center gap-1"><FlaskConical className="h-4 w-4"/>{details?.alchemicalItems.get(id)?.name}</p>)}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {selectedEncounter && (
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>{selectedEncounter.name}</CardTitle>
                                        <CardDescription>TR: {selectedEncounter.totalTR}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" onClick={() => handleRunEncounter(selectedEncounter.id)}><Swords className="h-4 w-4 mr-2"/>Run Encounter</Button>
                                        <p className="mt-4 text-sm whitespace-pre-wrap">{selectedEncounter.sceneDescription}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </ScrollArea>
                     </div>
                )}
                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <svg width="100%" height="100%" className="absolute inset-0">
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--border))" /></marker>
                                <marker id="arrow-highlight" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" /></marker>
                            </defs>
                            {dungeon.connections.map((conn, i) => {
                                const fromNode = dungeon.rooms.find(r => r.instanceId === conn.from);
                                const toNode = dungeon.rooms.find(r => r.instanceId === conn.to);
                                if (!fromNode || !toNode) return null;
                                
                                const isHighlighted = selectedRoomId && (conn.from === selectedRoomId || conn.to === selectedRoomId);
                                
                                const fromX = fromNode.position.x + 75;
                                const fromY = fromNode.position.y + 40;
                                const toX = toNode.position.x + 75;
                                const toY = toNode.position.y + 40;

                                // Calculate a control point for a quadratic Bezier curve
                                const midX = (fromX + toX) / 2;
                                const midY = (fromY + toY) / 2;
                                
                                const dx = toX - fromX;
                                const dy = toY - fromY;
                                
                                const length = Math.sqrt(dx * dx + dy * dy);
                                if (length === 0) return null; // Avoid division by zero

                                const perpX = -dy / length;
                                const perpY = dx / length;
                                
                                const curveFactor = 30;
                                
                                const controlX = midX + curveFactor * perpX;
                                const controlY = midY + curveFactor * perpY;
                                
                                const pathData = `M${fromX},${fromY} Q${controlX},${controlY} ${toX},${toY}`;
                                
                                return <path 
                                    key={i} 
                                    d={pathData}
                                    fill="none"
                                    strokeWidth={isHighlighted ? 3 : 2} 
                                    className={cn("transition-all", isHighlighted ? "stroke-primary" : "stroke-border")}
                                    markerEnd={isHighlighted ? "url(#arrow-highlight)" : "url(#arrow)"} 
                                />
                            })}
                        </svg>
                        {dungeon.rooms.map(roomInstance => {
                            const roomTemplate = details?.rooms.get(roomInstance.roomId);
                            return (
                                <div key={roomInstance.instanceId} style={{ left: roomInstance.position.x, top: roomInstance.position.y, position: 'absolute' }}>
                                    <Button
                                        variant={selectedRoomId === roomInstance.instanceId ? 'secondary' : 'outline'}
                                        className="w-[150px] h-[80px] flex-col items-center justify-center whitespace-normal text-center shadow-lg"
                                        onClick={() => { setSelectedRoomId(roomInstance.instanceId); setSelectedEncounterId(null); }}>
                                        <p className="font-bold">{roomTemplate?.name || 'Loading...'}</p>
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
