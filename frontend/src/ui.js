// ui.js — ReactFlow canvas
// Consumes nodeTypes and getDefaultData from the registry so the canvas
// automatically supports every node type without manual wiring.

import { useState, useRef, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  updateEdge,
} from 'reactflow';
import { Workflow } from 'lucide-react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { nodeTypes, getDefaultData, nodeAccentColors } from './nodes/nodeRegistry';
import { getCycleEdgeIds } from './lib/graph';

import 'reactflow/dist/style.css';

// ── Custom edge: gradient stroke + ×-delete button + reconnectable endpoints ──
function DeletableEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style = {},
  selected,
  data,
  // markerEnd from edge props intentionally ignored — we render our own below
}) {
  const { onEdgesChange } = useStore((s) => ({ onEdgesChange: s.onEdgesChange }));

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const isCycle    = data?.isCycle ?? false;
  const srcColor   = data?.sourceColor ?? '#6366f1';
  const tgtColor   = data?.targetColor ?? '#6366f1';
  const arrowColor = isCycle ? '#fb7185' : tgtColor;
  const gradId     = `eg-${id}`;
  const markId     = `em-${id}`;

  const deleteEdge = (e) => {
    e.stopPropagation();
    onEdgesChange([{ id, type: 'remove' }]);
  };

  return (
    <>
      <defs>
        {!isCycle && (
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={sourceX} y1={sourceY}
            x2={targetX} y2={targetY}
          >
            <stop offset="0%"   stopColor={srcColor} />
            <stop offset="100%" stopColor={tgtColor} />
          </linearGradient>
        )}
        <marker id={markId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={arrowColor} />
        </marker>
      </defs>

      <BaseEdge
        path={edgePath}
        style={{
          stroke: isCycle ? '#fb7185' : `url(#${gradId})`,
          strokeWidth: style.strokeWidth ?? 1.8,
        }}
        markerEnd={`url(#${markId})`}
      />

      <EdgeLabelRenderer>
        <div
          className="nopan nodrag"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            opacity: selected ? 1 : 0,
            transition: 'opacity 0.15s',
          }}
        >
          <button
            onClick={deleteEdge}
            title="Delete edge"
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#0e1828',
              border: '1px solid #fb7185',
              color: '#fb7185',
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { deletable: DeletableEdge };

const proOptions = { hideAttribution: true };
const GRID = 20;

const selector = (s) => ({
  nodes: s.nodes,
  edges: s.edges,
  getNodeID: s.getNodeID,
  addNode: s.addNode,
  onNodesChange: s.onNodesChange,
  onEdgesChange: s.onEdgesChange,
  onConnect: s.onConnect,
  setEdges: s.setEdges,
});

export const PipelineUI = () => {
  const wrapperRef = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);

  const {
    nodes,
    edges,
    getNodeID,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setEdges,
  } = useStore(selector, shallow);

  // Read fresh edges at reconnect time to avoid stale-closure mismatch.
  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      const { edges: fresh } = useStore.getState();
      setEdges(updateEdge(oldEdge, newConnection, fresh));
    },
    [setEdges]
  );

  // ── Live cycle highlighting ─────────────────────────────────────────────
  const cycleEdgeIds = useMemo(() => getCycleEdgeIds(nodes, edges), [nodes, edges]);

  const styledEdges = useMemo(() => {
    const typeByNode = Object.fromEntries(nodes.map((n) => [n.id, n.type]));
    return edges.map((e) =>
      cycleEdgeIds.has(e.id)
        ? { ...e, type: 'deletable', animated: false,
            style: { strokeWidth: 2.5 },
            data: { isCycle: true } }
        : { ...e, type: 'deletable',
            data: {
              sourceColor: nodeAccentColors[typeByNode[e.source]] ?? '#6366f1',
              targetColor: nodeAccentColors[typeByNode[e.target]] ?? '#6366f1',
            } }
    );
  }, [edges, cycleEdgeIds, nodes]);

  // ── Drop handler ────────────────────────────────────────────────────────
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/reactflow');
      if (!raw) return;

      const { nodeType } = JSON.parse(raw);
      if (!nodeType) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = rfInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const id = getNodeID(nodeType);
      addNode({
        id,
        type: nodeType,
        position,
        data: getDefaultData(nodeType, id),
      });
    },
    [rfInstance, getNodeID, addNode]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* ── Empty canvas hint ── */}
      {nodes.length === 0 && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 4,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 14, pointerEvents: 'none',
          }}
        >
          <Workflow size={46} style={{ color: '#1e2d47' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 600, color: '#283452' }}>
              Drop a node to get started
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#1a2640' }}>
              or load a template from the header
            </p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={proOptions}
        snapGrid={[GRID, GRID]}
        snapToGrid
        deleteKeyCode={['Backspace', 'Delete']}
        connectionLineType="smoothstep"
        edgesUpdatable
        edgesFocusable
        edgeUpdaterRadius={16}
        onEdgeUpdate={onEdgeUpdate}
        defaultEdgeOptions={{
          type: 'deletable',
          animated: true,
        }}
        fitViewOptions={{ padding: 0.3 }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#283452"
          gap={GRID}
          size={1.2}
        />
        <Controls
          style={{
            background: '#16223c',
            border: '1px solid #283452',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            // Colour the minimap dots by node accent — gives spatial overview.
            const accentMap = {
              customInput: '#34d399',
              customOutput: '#38bdf8',
              llm: '#8b5cf6',
              text: '#22d3ee',
              httpRequest: '#fb923c',
              conditional: '#fbbf24',
              math: '#fb7185',
              note: '#94a3b8',
              aggregator: '#818cf8',
            };
            return accentMap[n.type] ?? '#6366f1';
          }}
          maskColor="rgba(11,17,32,0.7)"
          style={{
            background: '#111a2e',
            border: '1px solid #283452',
            borderRadius: 8,
          }}
        />
      </ReactFlow>
    </div>
  );
};
