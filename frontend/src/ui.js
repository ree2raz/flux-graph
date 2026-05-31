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
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { nodeTypes, getDefaultData } from './nodes/nodeRegistry';

import 'reactflow/dist/style.css';

// ── Custom edge with a ×-button that appears when the edge is selected ─────────
function DeletableEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style,
  markerEnd,
  selected,
}) {
  const { onEdgesChange } = useStore((s) => ({ onEdgesChange: s.onEdgesChange }));

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const deleteEdge = (e) => {
    e.stopPropagation();
    onEdgesChange([{ id, type: 'remove' }]);
  };

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />
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
  getCycleEdgeIds: s.getCycleEdgeIds,
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
    getCycleEdgeIds,
  } = useStore(selector, shallow);

  // Allow dragging an edge endpoint to a different handle (reconnect).
  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => setEdges(updateEdge(oldEdge, newConnection, edges)),
    [edges, setEdges]
  );

  // ── Live cycle highlighting ─────────────────────────────────────────────
  // Memoize the Kahn sweep so it only re-runs when nodes/edges actually change.
  const cycleEdgeIds = useMemo(() => getCycleEdgeIds(), [nodes, edges, getCycleEdgeIds]);

  const styledEdges = useMemo(() =>
    edges.map((e) =>
      cycleEdgeIds.has(e.id)
        ? {
            ...e,
            type: 'deletable',
            animated: false,
            style: { stroke: '#fb7185', strokeWidth: 2.5 },
            markerEnd: { type: 'arrowclosed', color: '#fb7185', width: 14, height: 14 },
          }
        : { ...e, type: 'deletable' }
    ),
  [edges, cycleEdgeIds]);

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
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
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
        onEdgeUpdate={onEdgeUpdate}
        defaultEdgeOptions={{
          type: 'deletable',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 1.8 },
          markerEnd: { type: 'arrowclosed', color: '#6366f1', width: 14, height: 14 },
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
