
"use client";

import React, { useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MainLayout from "@/components/main-layout";

const HEX_SIZE = 40;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;

const hexPoints = [
  { x: 0, y: -HEX_SIZE },
  { x: HEX_WIDTH / 2, y: -HEX_SIZE / 2 },
  { x: HEX_WIDTH / 2, y: HEX_SIZE / 2 },
  { x: 0, y: HEX_SIZE },
  { x: -HEX_WIDTH / 2, y: HEX_SIZE / 2 },
  { x: -HEX_WIDTH / 2, y: -HEX_SIZE / 2 },
].map(p => `${p.x},${p.y}`).join(' ');

const HexagonNode = () => {
  return (
    <svg 
      width={HEX_WIDTH} 
      height={HEX_HEIGHT} 
      viewBox={`-${HEX_WIDTH/2} -${HEX_SIZE} ${HEX_WIDTH} ${HEX_HEIGHT}`}
      style={{ overflow: 'visible' }}
    >
      <polygon points={hexPoints} fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
    </svg>
  );
};

const nodeTypes = { hexagon: HexagonNode };

function MapGrid() {
    const initialNodes = useMemo(() => {
        const nodes = [];
        const radius = 20;

        for (let q = -radius; q <= radius; q++) {
            const r1 = Math.max(-radius, -q - radius);
            const r2 = Math.min(radius, -q + radius);
            for (let r = r1; r <= r2; r++) {
                const x = HEX_WIDTH * (q + r/2);
                const y = (HEX_HEIGHT * 3/4) * r;
                
                nodes.push({
                    id: `q${q}-r${r}`,
                    type: 'hexagon',
                    position: { x, y },
                    data: {},
                    draggable: false,
                    selectable: false,
                    connectable: false,
                });
            }
        }
        return nodes;
    }, []);

    return (
        <ReactFlow
            nodes={initialNodes}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={false}
        >
            <Background />
            <Controls />
            <MiniMap nodeColor={(n) => 'hsl(var(--card))'} nodeStrokeWidth={3} />
        </ReactFlow>
    );
}

export default function MapsPage() {
  return (
    <MainLayout showSidebarTrigger={false}>
      <div className="w-full h-full">
        <ReactFlowProvider>
          <MapGrid />
        </ReactFlowProvider>
      </div>
    </MainLayout>
  );
}
