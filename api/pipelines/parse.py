"""
Vercel serverless function — mirrors /pipelines/parse from the FastAPI backend.
No external dependencies: pure stdlib only.

Route (Vercel file-based routing): POST /api/pipelines/parse
"""

from http.server import BaseHTTPRequestHandler
from collections import defaultdict, deque
import json


# ── DAG detection (Kahn's topological sort) ───────────────────────────────────

def check_is_dag(node_ids: list, edges: list) -> bool:
    if not node_ids:
        return True

    node_set = set(node_ids)
    adj = defaultdict(list)
    in_degree = {n: 0 for n in node_ids}

    for edge in edges:
        src = edge.get("source", "")
        tgt = edge.get("target", "")
        if src in node_set and tgt in node_set:
            adj[src].append(tgt)
            in_degree[tgt] += 1

    queue = deque(n for n in node_ids if in_degree[n] == 0)
    processed = 0

    while queue:
        node = queue.popleft()
        processed += 1
        for neighbor in adj[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return processed == len(node_ids)


# ── Vercel handler ────────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        """CORS preflight."""
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")

            nodes = body.get("nodes", [])
            edges = body.get("edges", [])
            node_ids = [n["id"] for n in nodes if "id" in n]

            result = {
                "num_nodes": len(nodes),
                "num_edges": len(edges),
                "is_dag": check_is_dag(node_ids, edges),
            }
            self._respond(200, result)

        except Exception as exc:
            self._respond(400, {"error": str(exc)})

    def _respond(self, status: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass  # suppress default request logging
