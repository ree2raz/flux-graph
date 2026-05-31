# Fluxgraph

A visual pipeline builder. Drag nodes onto a canvas, wire their handles
together, and submit the graph to a backend that reports its node/edge counts
and whether it's a DAG.

- **Frontend:** React 18, ReactFlow 11, Zustand (state + localStorage), Lucide icons. CRA build, no CSS framework.
- **Backend:** FastAPI + Pydantic v2 on uvicorn. DAG check via Kahn's topological sort (stdlib only).

```
.
├── frontend/   React + ReactFlow editor   (frontend/README.md)
├── backend/    FastAPI /pipelines/parse    (backend/README.md)
└── vercel.json multi-service deploy config
```

## Quick start

```bash
# frontend  → http://localhost:3000
cd frontend && npm install && npm start

# backend   → http://localhost:8000
cd backend && uv sync && uv run uvicorn main:app --reload

# tests (14)
cd backend && uv run pytest test_main.py -v
```

The frontend talks to the backend on `:8000` in dev. Plain-pip backend setup is
in [`backend/README.md`](backend/README.md).

---

## How it's built

### 1. Node abstraction

The problem: copy-pasting a node file per type duplicates layout, handles, and
styling. The fix is a **schema-driven registry** — `src/nodes/nodeRegistry.js`
is the single source of truth, and a node is just a config object:

```js
{
  type: 'httpRequest',
  label: 'HTTP Request',
  Icon: Globe,
  accentColor: '#fb923c',
  fields: [
    { key: 'url',    type: 'text',   label: 'URL' },
    { key: 'method', type: 'select', options: ['GET', 'POST'] },
  ],
  handles: [
    { id: 'body',    type: 'target', position: 'left',  label: 'Body' },
    { id: 'success', type: 'source', position: 'right', label: 'Success' },
  ],
}
```

From that one object the registry derives the ReactFlow `nodeTypes` entry, the
toolbar chip, and the default `data` for a freshly dropped node. **Adding a node
type = adding one object; no other file changes.**

Two pieces do the rendering:

- **`BaseNode`** — the only presentational shell. Owns header, body, accent
  theming, selection state, and even handle spacing (handles on the same side
  are distributed evenly). Takes declarative `fields` *or* arbitrary `children`.
- **`FieldRenderer`** — maps a field `type` (`text`, `textarea`, `select`,
  `number`, `checkbox`) to a controlled input bound to the Zustand store.

Five extra nodes ship to exercise the abstraction: **HTTP Request** (checkbox +
two source handles), **Conditional** (true/false branches), **Math** (two
inputs), **Aggregator** (three inputs), and **Note** (zero handles — proof it
composes down to no I/O).

### 2. Styling

One dark theme, driven by data. Each node config carries an `accentColor`;
`BaseNode` derives the header gradient, handle dots, and selection ring from
that single value, so a new node is themed for free. Shared system: `#0b1120`
canvas, `#111a2e` surfaces, Inter font, 10px uppercase field labels, animated
`smoothstep` edges, accent-tinted minimap. Styling is inline style objects plus
a little plain CSS in `src/index.css` — no framework.

### 3. Text node

`src/nodes/textNode.js` reuses `BaseNode`'s shell but supplies a custom body and
adds two behaviours:

- **Auto-resize** — width tracks the longest line (clamped 240–580px), height
  tracks line count, so the node grows with its content.
- **Dynamic handles** — typing `{{ name }}` creates a matching left-side input
  handle. `parseVariables` (`src/lib/variables.js`) extracts valid JS
  identifiers, dedupes them in first-seen order, and spaces the handles evenly.
  Deleting a variable prunes its connected edges so the graph stays consistent.

### 4. Backend integration

`src/submit.js` POSTs `{ nodes, edges }` to `POST /pipelines/parse`. The backend
returns `{ num_nodes, num_edges, is_dag }`, with `is_dag` computed by Kahn's
topological sort (O(V+E), no graph library); edges pointing at unknown node ids
are ignored so partial state can't crash it.

Beyond the basics:

- Result shown in an animated **modal** (not `window.alert`) with stat cards and
  a plain-language DAG explanation.
- A **live DAG indicator** runs the same Kahn sweep client-side
  (`src/lib/graph.js`); cycle edges turn red on the canvas in real time.
- Submit has loading + network-error states.
- Zustand `persist` saves the pipeline to localStorage across refreshes.

---

## Quick bite: how the DAG check works

`is_dag` uses **Kahn's topological sort** (`check_is_dag` in `backend/main.py`,
mirrored in `src/lib/graph.js`). The principle: a graph is a DAG **iff** you can
repeatedly remove nodes that have no incoming edges until none are left.

1. Count incoming edges per node (`in_degree`); build an adjacency list.
2. Queue every node with `in_degree == 0` (no dependencies).
3. Pop a node, count it, and decrement each neighbor's in-degree — when a
   neighbor hits 0, queue it.
4. If you processed **every** node → DAG. If some never reach in-degree 0,
   they're stuck in a cycle → not a DAG.

Why it works: nodes in a cycle (`A→B→C→A`) always keep an incoming edge from a
peer, so they never enter the queue. Runs in **O(V + E)**, no recursion, no
graph library. Edges referencing unknown node ids are ignored so partial state
can't crash it. The client runs the same sweep to highlight cycle edges live —
`getCycleEdgeIds` returns the edges whose endpoints are both unprocessed nodes.

---

## Deployment

`vercel.json` deploys both services (`experimentalServices`): frontend at `/`,
FastAPI backend at `/_/backend`. In a production build `submit.js` targets
`/_/backend/pipelines/parse`; in dev it targets `http://localhost:8000`.

> `experimentalServices` is a non-standard Vercel feature — treat the hosted
> deploy as best-effort. The FastAPI service is the single source of truth for
> the endpoint; local development is unaffected.
