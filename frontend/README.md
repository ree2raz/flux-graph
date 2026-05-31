# VectorShift Frontend — Pipeline Builder

React + [ReactFlow](https://reactflow.dev/) drag-and-drop pipeline editor.
Bootstrapped with Create React App.

For the full design write-up (node abstraction, text-node logic, backend
integration), see the [root README](../README.md). This file covers running and
working on the frontend in isolation.

## Run

```bash
cd frontend
npm install
npm start          # http://localhost:3000
```

`npm start` expects the backend on `http://localhost:8000` (see
[`../backend`](../backend)). The submit button posts the pipeline there; in a
production build it instead targets the `/_/backend` service route (see
`src/submit.js`).

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server with hot reload at :3000 |
| `npm run build` | Optimised production build into `build/` |
| `npm test` | CRA / Jest test runner (watch mode) |

## Source layout

```
src/
  App.js              App shell: header, toolbar, canvas, submit bar, modal
  store.js            Zustand store (+ persist); node/edge CRUD, cycle detection
  ui.js               ReactFlow canvas, drop handling, deletable edges
  toolbar.js          Draggable node palette (derived from the registry)
  draggableNode.js    A single draggable toolbar chip
  submit.js           Submit button → POST /pipelines/parse → store result
  nodes/
    nodeRegistry.js   Single source of truth: every node type as config
    BaseNode.js       Shared presentational shell (header, body, handles)
    FieldRenderer.js  Schema field → controlled input
    textNode.js       Text node: auto-resize + dynamic {{variable}} handles
  components/
    ResultModal.js    Pipeline-analysis result dialog
  lib/
    graph.js          Client-side Kahn DAG / cycle-edge detection
    variables.js      {{ variable }} parsing + handle spacing helpers
```

## Adding a node type

Add one object to `NODE_DEFINITIONS` in `src/nodes/nodeRegistry.js`. The
toolbar chip, ReactFlow `nodeTypes` entry, and default node data are all derived
automatically — no other files to touch. See the root README for the field and
handle schema.

## Styling

Styling is done with inline style objects plus a small amount of plain CSS in
`src/index.css` (ReactFlow overrides, scrollbars, and the `@keyframes` used by
inline `animation:` styles). Each node carries its own `accentColor`, which
`BaseNode` uses to tint headers, handle dots, and selection rings. There is no
CSS framework dependency.
