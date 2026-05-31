# VectorShift — Frontend Technical Assessment

An AI pipeline builder: a drag-and-drop node editor (React + ReactFlow) backed
by a FastAPI service that validates the graph. Build a pipeline, hit submit, and
get back the node/edge counts and whether the graph is a DAG.

## Tech stack

- **Frontend:** React 18, ReactFlow 11, Zustand (state + localStorage persist), Lucide icons. Create React App build. Styling via inline styles + plain CSS — no CSS framework.
- **Backend:** FastAPI + Pydantic v2, served by uvicorn. DAG check via Kahn's topological sort (stdlib only).

## Project structure

```
.
├── frontend/      React + ReactFlow app  (see frontend/README.md)
│   └── src/
│       ├── nodes/         node registry, BaseNode, FieldRenderer, textNode
│       ├── components/    ResultModal
│       └── lib/           client-side DAG + variable parsing
├── backend/       FastAPI /pipelines/parse service  (see backend/README.md)
└── vercel.json    multi-service deploy config (frontend + FastAPI backend)
```

---

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm start          # http://localhost:3000
```

### Backend
```bash
cd backend
uv sync                            # install from pyproject.toml / uv.lock
uv run uvicorn main:app --reload   # http://localhost:8000
```
(Plain pip alternative in [`backend/README.md`](backend/README.md).)

### Backend tests
```bash
cd backend
uv run pytest test_main.py -v      # 14 tests, all green
```

---

## Design decisions worth calling out

### Part 1 — Node Abstraction

The central idea is a **schema-driven node registry** (`src/nodes/nodeRegistry.js`) that is the single source of truth for every node type in the system.

A node is defined as a plain JS object:

```js
{
  type: 'httpRequest',
  label: 'HTTP Request',
  title: 'HTTP Request',
  Icon: Globe,           // Lucide icon component
  accentColor: '#fb923c',
  fields: [
    { key: 'url',    type: 'text', label: 'URL', default: '…' },
    { key: 'method', type: 'select', options: ['GET','POST',…] },
  ],
  handles: [
    { id: 'body',    type: 'target', position: 'left',  label: 'Body'    },
    { id: 'success', type: 'source', position: 'right', label: 'Success' },
    { id: 'error',   type: 'source', position: 'right', label: 'Error'   },
  ],
}
```

From that one object the registry automatically derives:
| Derived artifact | Where used |
|---|---|
| ReactFlow `nodeTypes` entry | `<PipelineUI>` |
| Toolbar chip | `<PipelineToolbar>` |
| Default `data` for new nodes | `onDrop` handler |

**Adding a new node = adding one config object. Zero other files to touch.**

#### Supporting components
- **`BaseNode`** — the single presentational shell. Owns all layout, handle spacing (evenly distributed per side), accent theming, and selection states. Accepts either declarative `fields` **or** custom `children` for nodes that need a bespoke body.
- **`FieldRenderer`** — maps field type → controlled input (`text`, `textarea`, `select`, `number`, `checkbox`), wired to the Zustand store via `updateNodeField`.

#### The 5 new nodes

| Node | Accent | Interesting aspect |
|---|---|---|
| **HTTP Request** | Orange | Shows `checkbox` field type; 2 source handles (success / error) |
| **Conditional** | Amber | If/else branching; 2 source handles (true / false) |
| **Math Transform** | Rose | 2 target handles (a, b); operation `select` + expression `text` |
| **Note** | Slate | Zero handles — proves the abstraction composes to no-I/O nodes |
| **Aggregator** | Indigo | 3 target handles (in1–in3); `limit` number field |

#### Nodes with special runtime behaviour

**TextNode** (`src/nodes/textNode.js`) opts out of auto-generation via `component: TextNode` in its registry entry. It still uses `BaseNode` as its shell — proof that the abstraction bends without breaking.

---

### Part 2 — Styling

- **Dark VectorShift palette** — `#0b1120` canvas, `#111a2e` node surfaces, `#6366f1` brand accent.
- **Per-node accent colours** — each node definition carries its own `accentColor`; `BaseNode` tints the header gradient, handle dots, and selection ring from this single value.
- **Cohesive system** — Inter font, consistent 10px uppercase labels, 8–10px border-radius, `smoothstep` animated edges, accent-coloured MiniMap dots.

---

### Part 3 — Text Node Logic

**Auto-resize**
- Width is estimated from the longest line (`maxLen * 7.5px + padding`), clamped to 240–580 px.
- Height uses a `rows` count derived from the newline count, so the node grows vertically.
- ReactFlow's ResizeObserver detects the DOM change and re-renders edges automatically.

**Dynamic variable handles**
- `parseVariables(text)` (in `src/lib/variables.js`) extracts all `{{ validJsIdentifier }}` tokens using a regex that validates the JS identifier grammar.
- Duplicates are deduplicated in first-seen order.
- Handles are evenly spaced via `handleTop(i, total)`.
- When a variable is removed from the text, `removeEdgesForHandle` is called on the store, pruning any connected edges so the graph stays consistent.
- Detected variable tokens are shown as cyan pills below the textarea for at-a-glance visibility.

---

### Part 4 — Backend Integration

**Endpoint:** `POST /pipelines/parse`  
**Request:** `{ nodes: Node[], edges: Edge[] }` (standard ReactFlow serialisation)  
**Response:** `{ num_nodes: int, num_edges: int, is_dag: bool }`

DAG detection uses **Kahn's topological sort** (O(V + E)) — no external graph library needed. Edges that reference node IDs not present in the `nodes` list are silently ignored (dangling edges from partially-loaded state don't crash the server).

**Frontend extras beyond the spec**
- **Loading state** — spinner on the submit button while the request is in-flight.
- **Error handling** — network errors (backend not running) show an inline message.
- **Polished result modal** — animated card dialog (not `window.alert`) with stat cards for nodes/edges/DAG status plus an explanatory sentence.
- **Live DAG indicator** — the status bar shows `✓ Valid DAG` / `⚠ Cycle detected` in real time using the same Kahn algorithm run client-side. Cycle-participating edges turn red on the canvas instantly.
- **localStorage persistence** — Zustand `persist` middleware auto-saves the pipeline so a page refresh doesn't lose work.

---

## Deployment

`vercel.json` deploys both pieces as Vercel multi-service apps
(`experimentalServices`): the CRA frontend at `/` and the FastAPI backend at
`/_/backend`. In a production build `src/submit.js` targets
`/_/backend/pipelines/parse`; in development it targets
`http://localhost:8000/pipelines/parse`.

> **Note:** `experimentalServices` is a non-standard Vercel feature, so treat
> the hosted deploy as best-effort. The FastAPI service in `backend/` is the
> single source of truth for the endpoint — there is no separate serverless
> copy. Local development (the workflow the assessment specifies) is unaffected:
> run the frontend on :3000 and the backend on :8000 as shown above.
