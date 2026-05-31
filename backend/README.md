# Fluxgraph Backend — Pipeline Parse API

A small FastAPI service that validates serialised ReactFlow pipelines.

## Endpoint

`POST /pipelines/parse`

**Request** — standard ReactFlow serialisation:

```json
{ "nodes": [ { "id": "..." } ], "edges": [ { "id": "...", "source": "...", "target": "..." } ] }
```

Extra ReactFlow fields (`position`, `data`, `sourceHandle`, `animated`, …) are
accepted and ignored.

**Response:**

```json
{ "num_nodes": 3, "num_edges": 2, "is_dag": true }
```

There is also a `GET /` health check returning `{ "status": "ok" }`.

## DAG detection

`is_dag` is computed with **Kahn's topological sort** (`check_is_dag` in
`main.py`) — O(V + E), no external graph library. Edges that reference a node id
not present in `nodes` are ignored, so a partially-loaded frontend state can't
crash the endpoint.

## Run locally

Using [uv](https://docs.astral.sh/uv/) (a `uv.lock` is committed):

```bash
cd backend
uv sync                       # install from pyproject.toml / uv.lock
uv run uvicorn main:app --reload   # http://localhost:8000
```

Or with a plain virtualenv + pip:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload     # http://localhost:8000
```

Interactive API docs are available at `http://localhost:8000/docs`.

## Tests

```bash
uv run pytest test_main.py -v   # 14 tests
```

Coverage includes empty/single-node graphs, linear chains, a diamond DAG,
self-loops, 2- and 3-node cycles, disconnected components, and dangling edges.

## Requirements

Python ≥ 3.12. Dependencies are declared in `pyproject.toml` (and mirrored in
`requirements.txt` for the pip workflow): `fastapi`, `uvicorn[standard]`,
`pydantic` v2, plus `httpx` and `pytest` for tests.
