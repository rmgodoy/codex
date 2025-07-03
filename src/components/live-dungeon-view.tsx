
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';

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
import FloatingEdge from './floating-edge';
import FloatingConnectionLine from './floating-connection-line';


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

const edgeTypes = {
  floating: FloatingEdge,
};

function LiveDungeonViewComponent({ dungeon, onEndDungeon }: LiveDungeonViewProps) {
    const [loading, setLoading] = useState(true);
    const [runningEncounter, setRunningEncounter] = useState<Encounter | null>(null);
    const [details, setDetails] = useState<DungeonDetails | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);

    const [totalActions, setTotalActions] = useState(0);
    const [alertHistory, setAlertHistory] = useState<number[]>([0]);
    
    const { toast } = useToast();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

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
                const lastAlert = prevHistory[prevHistory.length - 1] ?? 0;
                if (nextTotal >= newHistory.length) {
                    newHistory[nextTotal] = lastAlert;
                }
                return newHistory;
            });
            return nextTotal;
        });
    };

    const handlePrevAction = () => {
        setTotalActions(prevTotal => Math.max(0, prevTotal - 1));
    };
    
    const handleNodeClick = useCallback((event: React.MouseEvent | null, node: Node | null) => {
      if (!node) {
          setSelectedRoomId(null);
          setSelectedEncounterId(null);
          return;
      }
      setSelectedRoomId(node.id);
      setSelectedEncounterId(null);
      fitView({ nodes: [{ id: node.id }], duration: 600, padding: 0.2 });
    }, [fitView, setSelectedRoomId, setSelectedEncounterId]);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const rooms = await getAllRooms();
            const roomsMap = new Map(rooms.map(r => [r.id, r]));
            
            const encounterIds = rooms.flatMap(r => r.features.flatMap(f => f.encounterIds));
            const encounters = await Promise.all(encounterIds.map(id => getEncounterById(id).catch(() => null)));

            const treasureIds = rooms.flatMap(r => r.features.flatMap(f => f.treasureIds));
            const treasures = await getAllTreasures();
            
            const alchemicalItemIds = rooms.flatMap(r => r.features.flatMap(f => f.alchemicalItemIds));
            const alchemicalItems = await getAllAlchemicalItems();

            setDetails({
                rooms: roomsMap,
                encounters: new Map(encounters.filter((e): e is Encounter => e !== null).map(e => [e.id, e])),
                treasures: new Map(treasures.map(t => [t.id, t])),
                alchemicalItems: new Map(alchemicalItems.map(a => [a.id, a]))
            });
            setLoading(false);
        };
        fetchDetails();
    }, [dungeon]);
    
    useEffect(() => {
        if (!dungeon || !details) return;

        const initialNodes: Node[] = dungeon.rooms.map((roomInstance): Node => {
            const roomTemplate = details.rooms.get(roomInstance.roomId);
            return {
                id: roomInstance.instanceId,
                position: roomInstance.position,
                data: { label: roomTemplate?.name || 'Loading...' },
                connectable: false,
                style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                    border: '2px solid',
                    borderColor: 'hsl(var(--border))',
                    width: 150,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: '1rem',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                },
                type: 'default',
            };
        });

        const initialEdges = dungeon.connections.map((conn): Edge => {
            return {
                id: `edge-${conn.from}-${conn.to}`,
                source: conn.from,
                target: conn.to,
                type: 'floating',
                style: {
                    strokeWidth: 2,
                    stroke: 'hsl(var(--border))',
                },
            };
        });
        
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [dungeon, details, setNodes, setEdges]);
    
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                const isSelected = node.id === selectedRoomId;
                return {
                    ...node,
                    style: {
                        ...node.style,
                        background: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                        color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--card-foreground))',
                        borderColor: isSelected ? 'hsl(var(--ring))' : 'hsl(var(--border))',
                    },
                };
            })
        );

        setEdges((eds) =>
            eds.map((edge) => {
                const isHighlighted = selectedRoomId && (edge.source === selectedRoomId || edge.target === selectedRoomId);
                return {
                    ...edge,
                    animated: isHighlighted,
                    style: {
                        ...edge.style,
                        strokeWidth: isHighlighted ? 2.5 : 1.5,
                        stroke: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    },
                };
            })
        );
    }, [selectedRoomId, setNodes, setEdges]);
    
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
                <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-background to-muted/20">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={handleNodeClick}
                        onPaneClick={() => handleNodeClick(null, null)}
                        fitView
                        nodesDraggable={true}
                        edgeTypes={edgeTypes}
                        connectionLineComponent={FloatingConnectionLine}
                    >
                        <Controls />
                        <MiniMap pannable zoomable nodeStrokeWidth={3} nodeColor={(n) => n.style?.background as string || '#fff'} />
                        <Background variant="dots" gap={16} size={1} />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}

export default function LiveDungeonView(props: LiveDungeonViewProps) {
    return (
        <ReactFlowProvider>
            <LiveDungeonViewComponent {...props} />
        </ReactFlowProvider>
    );
}

    