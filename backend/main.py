"""
VectorShift — Pipeline Parse API
=================================
POST /pipelines/parse
  Accepts a serialised ReactFlow pipeline (nodes + edges),
  returns the number of nodes, edges, and whether the graph is a DAG.

DAG detection uses Kahn's topological-sort algorithm:
  O(V + E) — no external graph library required.
"""

from __future__ import annotations

from collections import defaultdict, deque
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="VectorShift Pipeline API",
    description="Parse and validate AI pipeline graphs.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # same-domain on Vercel; localhost in dev
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


# ── Request / response models ─────────────────────────────────────────────────

class NodeModel(BaseModel):
    id: str
    type: str = ""
    # Accept (and ignore) any extra ReactFlow node fields.
    model_config = {"extra": "allow"}


class EdgeModel(BaseModel):
    id: str
    source: str
    target: str
    # Accept sourceHandle, targetHandle, animated, etc.
    model_config = {"extra": "allow"}


class PipelineRequest(BaseModel):
    nodes: list[NodeModel] = Field(default_factory=list)
    edges: list[EdgeModel] = Field(default_factory=list)


class PipelineResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool


# ── Graph utilities ───────────────────────────────────────────────────────────

def check_is_dag(node_ids: list[str], edges: list[EdgeModel]) -> bool:
    """
    Kahn's topological sort.

    Build an adjacency list and in-degree map from the edge list, then
    repeatedly remove zero-in-degree nodes. If every node is processed,
    the graph has no cycles → it is a DAG.

    Edges that reference non-existent node IDs are silently ignored
    so a partially-loaded frontend state doesn't crash the endpoint.
    """
    if not node_ids:
        return True

    node_set: set[str] = set(node_ids)
    adj: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = {n: 0 for n in node_ids}

    for edge in edges:
        src, tgt = edge.source, edge.target
        if src in node_set and tgt in node_set:
            adj[src].append(tgt)
            in_degree[tgt] += 1

    queue: deque[str] = deque(n for n in node_ids if in_degree[n] == 0)
    processed = 0

    while queue:
        node = queue.popleft()
        processed += 1
        for neighbor in adj[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return processed == len(node_ids)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "VectorShift Pipeline API"}


@app.post(
    "/pipelines/parse",
    response_model=PipelineResponse,
    summary="Parse pipeline",
    description=(
        "Accepts a ReactFlow pipeline (nodes + edges) and returns "
        "node count, edge count, and whether the graph is a DAG."
    ),
    tags=["pipelines"],
)
def parse_pipeline(pipeline: PipelineRequest) -> PipelineResponse:
    node_ids = [node.id for node in pipeline.nodes]
    dag = check_is_dag(node_ids, pipeline.edges)

    return PipelineResponse(
        num_nodes=len(pipeline.nodes),
        num_edges=len(pipeline.edges),
        is_dag=dag,
    )
