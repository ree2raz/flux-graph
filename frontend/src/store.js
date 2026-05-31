// store.js
// Zustand store with:
//   • zustand/persist  — pipeline auto-saved to localStorage
//   • getCycleEdgeIds  — live cycle detection, consumed by PipelineCanvas
//   • removeEdgesForHandle — called by TextNode when a variable is removed

import { createWithEqualityFn as create } from 'zustand/traditional';
import { persist } from 'zustand/middleware';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import { getCycleEdgeIds } from './lib/graph';

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Node deletion ──────────────────────────────────────────────────────
      removeNode: (nodeId) =>
        set({
          nodes: get().nodes.filter((n) => n.id !== nodeId),
          edges: get().edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
        }),

      // ── Clear everything ───────────────────────────────────────────────────
      clearPipeline: () => set({ nodes: [], edges: [], nodeIDs: {}, pipelineResult: null }),

      // ── Load a template ────────────────────────────────────────────────────
      loadTemplate: ({ nodes, edges, nodeIDs }) =>
        set({ nodes, edges, nodeIDs, pipelineResult: null }),
      // ── State ──────────────────────────────────────────────────────────────
      nodes: [],
      edges: [],
      nodeIDs: {},

      // Result from the /pipelines/parse endpoint — shown in <ResultModal />.
      pipelineResult: null,

      // ── Node ID counter ────────────────────────────────────────────────────
      getNodeID: (type) => {
        const newIDs = { ...get().nodeIDs };
        newIDs[type] = (newIDs[type] ?? 0) + 1;
        set({ nodeIDs: newIDs });
        return `${type}-${newIDs[type]}`;
      },

      // ── Node / edge CRUD ───────────────────────────────────────────────────
      addNode: (node) => set({ nodes: [...get().nodes, node] }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) =>
        set({ nodes: applyNodeChanges(changes, get().nodes) }),

      onEdgesChange: (changes) =>
        set({ edges: applyEdgeChanges(changes, get().edges) }),

      onConnect: (connection) =>
        set({
          edges: addEdge(
            {
              ...connection,
              type: 'smoothstep',
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            },
            get().edges
          ),
        }),

      updateNodeField: (nodeId, fieldName, fieldValue) =>
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
              : node
          ),
        }),

      /**
       * Remove every edge that references a specific handle.
       * Called by TextNode when a {{ variable }} is deleted from the text.
       *
       * @param {string} nodeId       — the TextNode's ReactFlow id
       * @param {string} handleSuffix — the variable name (used as handle id suffix)
       */
      removeEdgesForHandle: (nodeId, handleSuffix) => {
        const handleId = `${nodeId}-${handleSuffix}`;
        set({
          edges: get().edges.filter(
            (e) =>
              e.sourceHandle !== handleId && e.targetHandle !== handleId
          ),
        });
      },

      // ── Live DAG utilities ─────────────────────────────────────────────────

      /**
       * Returns the Set of edge IDs that participate in cycles.
       * O(V + E) — safe to call in a React render.
       */
      getCycleEdgeIds: () => getCycleEdgeIds(get().nodes, get().edges),

      // ── Pipeline result (from backend) ─────────────────────────────────────
      setPipelineResult: (result) => set({ pipelineResult: result }),
      clearPipelineResult: () => set({ pipelineResult: null }),
    }),
    {
      name: 'fluxgraph-pipeline-v1',
      // Only persist graph data, not transient UI state.
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        nodeIDs: state.nodeIDs,
      }),
    }
  )
);
