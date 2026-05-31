"""
Tests for /pipelines/parse

Run with:  pytest test_main.py -v
"""

import pytest
from fastapi.testclient import TestClient
from main import app, check_is_dag
from main import EdgeModel

client = TestClient(app)


# ── Helpers ───────────────────────────────────────────────────────────────────

def node(nid: str, ntype: str = "custom") -> dict:
    return {"id": nid, "type": ntype}


def edge(eid: str, src: str, tgt: str) -> dict:
    return {"id": eid, "source": src, "target": tgt}


def post(nodes: list, edges: list) -> dict:
    resp = client.post("/pipelines/parse", json={"nodes": nodes, "edges": edges})
    assert resp.status_code == 200, resp.text
    return resp.json()


# ── Health ────────────────────────────────────────────────────────────────────

def test_health():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ── Empty pipeline ─────────────────────────────────────────────────────────────

def test_empty_pipeline():
    data = post([], [])
    assert data == {"num_nodes": 0, "num_edges": 0, "is_dag": True}


# ── Single node ───────────────────────────────────────────────────────────────

def test_single_node_is_dag():
    data = post([node("a")], [])
    assert data["num_nodes"] == 1
    assert data["num_edges"] == 0
    assert data["is_dag"] is True


# ── Linear chain ─────────────────────────────────────────────────────────────

def test_linear_chain_is_dag():
    data = post(
        [node("a"), node("b"), node("c")],
        [edge("e1", "a", "b"), edge("e2", "b", "c")],
    )
    assert data["num_nodes"] == 3
    assert data["num_edges"] == 2
    assert data["is_dag"] is True


# ── Diamond DAG ───────────────────────────────────────────────────────────────

def test_diamond_dag():
    #   a → b
    #   a → c
    #   b → d
    #   c → d
    data = post(
        [node("a"), node("b"), node("c"), node("d")],
        [
            edge("e1", "a", "b"),
            edge("e2", "a", "c"),
            edge("e3", "b", "d"),
            edge("e4", "c", "d"),
        ],
    )
    assert data["is_dag"] is True
    assert data["num_nodes"] == 4
    assert data["num_edges"] == 4


# ── Self-loop ─────────────────────────────────────────────────────────────────

def test_self_loop_not_dag():
    data = post([node("a")], [edge("e1", "a", "a")])
    assert data["is_dag"] is False


# ── Simple cycle ──────────────────────────────────────────────────────────────

def test_two_node_cycle_not_dag():
    data = post(
        [node("a"), node("b")],
        [edge("e1", "a", "b"), edge("e2", "b", "a")],
    )
    assert data["is_dag"] is False


def test_three_node_cycle_not_dag():
    data = post(
        [node("a"), node("b"), node("c")],
        [edge("e1", "a", "b"), edge("e2", "b", "c"), edge("e3", "c", "a")],
    )
    assert data["is_dag"] is False


# ── Disconnected graph (all components are DAGs) ──────────────────────────────

def test_disconnected_dag():
    # Two separate chains; no edges between them.
    data = post(
        [node("a"), node("b"), node("c"), node("d")],
        [edge("e1", "a", "b"), edge("e2", "c", "d")],
    )
    assert data["is_dag"] is True


# ── Edges referencing unknown nodes are ignored ───────────────────────────────

def test_dangling_edge_ignored():
    # Edge from "ghost" (not in nodes) to "a" should not crash.
    data = post(
        [node("a")],
        [edge("e1", "ghost", "a")],
    )
    assert data["num_nodes"] == 1
    assert data["num_edges"] == 1  # counted even if dangling
    assert data["is_dag"] is True


# ── check_is_dag unit tests ───────────────────────────────────────────────────

def _e(src: str, tgt: str) -> EdgeModel:
    return EdgeModel(id="x", source=src, target=tgt)


def test_unit_empty():
    assert check_is_dag([], []) is True


def test_unit_no_edges():
    assert check_is_dag(["a", "b", "c"], []) is True


def test_unit_cycle():
    assert check_is_dag(["a", "b"], [_e("a", "b"), _e("b", "a")]) is False


def test_unit_dag():
    assert check_is_dag(["a", "b", "c"], [_e("a", "b"), _e("b", "c")]) is True


# ── Disconnected: one component DAG + one cycle ────────────────────────────────

def test_mixed_component_cycle_not_dag():
    # a→b is clean; c→d→c is a cycle.
    data = post(
        [node("a"), node("b"), node("c"), node("d")],
        [edge("e1", "a", "b"), edge("e2", "c", "d"), edge("e3", "d", "c")],
    )
    assert data["is_dag"] is False


# ── Duplicate node IDs ────────────────────────────────────────────────────────

def test_duplicate_node_ids_still_dag():
    # Sending the same node id twice should not produce a false negative.
    data = post(
        [node("a"), node("a"), node("b")],
        [edge("e1", "a", "b")],
    )
    assert data["is_dag"] is True


def test_duplicate_node_ids_cycle_not_dag():
    data = post(
        [node("a"), node("a"), node("b")],
        [edge("e1", "a", "b"), edge("e2", "b", "a")],
    )
    assert data["is_dag"] is False


# ── Empty source / target strings ─────────────────────────────────────────────

def test_empty_source_target_ignored():
    # Edges with empty-string endpoints that don't match any node id are ignored.
    data = post(
        [node("a"), node("b")],
        [edge("e1", "", "b"), edge("e2", "a", ""), edge("e3", "a", "b")],
    )
    assert data["num_edges"] == 3  # all three counted
    assert data["is_dag"] is True  # only valid edge a→b is evaluated
