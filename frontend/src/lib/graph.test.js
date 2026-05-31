import { isDAG, getCycleEdgeIds } from './graph';

const node = (id) => ({ id });
const edge = (id, source, target) => ({ id, source, target });

// ── isDAG ────────────────────────────────────────────────────────────────────

describe('isDAG', () => {
  test('empty graph is a DAG', () => {
    expect(isDAG([], [])).toBe(true);
  });

  test('single node no edges', () => {
    expect(isDAG(['a'], [])).toBe(true);
  });

  test('linear chain', () => {
    expect(isDAG(['a', 'b', 'c'], [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }])).toBe(true);
  });

  test('diamond DAG', () => {
    expect(
      isDAG(['a', 'b', 'c', 'd'], [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'c' },
        { source: 'b', target: 'd' },
        { source: 'c', target: 'd' },
      ])
    ).toBe(true);
  });

  test('self-loop is not a DAG', () => {
    expect(isDAG(['a'], [{ source: 'a', target: 'a' }])).toBe(false);
  });

  test('two-node cycle is not a DAG', () => {
    expect(isDAG(['a', 'b'], [{ source: 'a', target: 'b' }, { source: 'b', target: 'a' }])).toBe(false);
  });

  test('three-node cycle is not a DAG', () => {
    expect(
      isDAG(['a', 'b', 'c'], [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
        { source: 'c', target: 'a' },
      ])
    ).toBe(false);
  });

  test('disconnected components all DAGs', () => {
    expect(isDAG(['a', 'b', 'c', 'd'], [{ source: 'a', target: 'b' }, { source: 'c', target: 'd' }])).toBe(true);
  });

  test('disconnected: one DAG + one cycle → not a DAG', () => {
    expect(
      isDAG(['a', 'b', 'c', 'd'], [
        { source: 'a', target: 'b' },
        { source: 'c', target: 'd' },
        { source: 'd', target: 'c' },
      ])
    ).toBe(false);
  });

  test('dangling edges (unknown node ids) are ignored', () => {
    expect(isDAG(['a'], [{ source: 'ghost', target: 'a' }])).toBe(true);
  });
});

// ── getCycleEdgeIds ───────────────────────────────────────────────────────────

describe('getCycleEdgeIds', () => {
  test('empty graph returns empty set', () => {
    expect(getCycleEdgeIds([], [])).toEqual(new Set());
  });

  test('DAG returns empty set', () => {
    const result = getCycleEdgeIds(
      [node('a'), node('b'), node('c')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'c')]
    );
    expect(result.size).toBe(0);
  });

  test('self-loop edge is returned', () => {
    const result = getCycleEdgeIds([node('a')], [edge('e1', 'a', 'a')]);
    expect(result).toEqual(new Set(['e1']));
  });

  test('two-node cycle returns both edges', () => {
    const result = getCycleEdgeIds(
      [node('a'), node('b')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'a')]
    );
    expect(result).toEqual(new Set(['e1', 'e2']));
  });

  test('three-node cycle returns all three edges', () => {
    const result = getCycleEdgeIds(
      [node('a'), node('b'), node('c')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'c'), edge('e3', 'c', 'a')]
    );
    expect(result).toEqual(new Set(['e1', 'e2', 'e3']));
  });

  test('mixed: one clean node connected to a cycle returns only cycle edges', () => {
    // a→b is clean; b↔c is a cycle
    const result = getCycleEdgeIds(
      [node('a'), node('b'), node('c')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'c'), edge('e3', 'c', 'b')]
    );
    expect(result.has('e1')).toBe(false);
    expect(result.has('e2')).toBe(true);
    expect(result.has('e3')).toBe(true);
  });
});
