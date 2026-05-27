/**
 * Client-side graph utilities.
 * These mirror the server-side logic so the UI gives instant DAG feedback.
 */

/**
 * Kahn's topological sort — returns true if the graph is a DAG.
 *
 * @param {string[]} nodeIds
 * @param {{ source: string; target: string }[]} edges
 */
export function isDAG(nodeIds, edges) {
  if (nodeIds.length === 0) return true;

  const nodeSet = new Set(nodeIds);
  const adj = {};
  const inDegree = {};

  for (const id of nodeIds) {
    adj[id] = [];
    inDegree[id] = 0;
  }

  for (const { source, target } of edges) {
    if (nodeSet.has(source) && nodeSet.has(target)) {
      adj[source].push(target);
      inDegree[target] += 1;
    }
  }

  const queue = nodeIds.filter((id) => inDegree[id] === 0);
  let processed = 0;

  while (queue.length > 0) {
    const node = queue.shift();
    processed += 1;
    for (const neighbor of adj[node]) {
      inDegree[neighbor] -= 1;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  return processed === nodeIds.length;
}

/**
 * Returns the set of edge IDs that participate in cycles.
 * Uses the same Kahn sweep: nodes not processed by Kahn are in cycles;
 * any edge whose source AND target are both unprocessed nodes is a cycle edge.
 *
 * @param {{ id: string }[]} nodes
 * @param {{ id: string; source: string; target: string }[]} edges
 * @returns {Set<string>}
 */
export function getCycleEdgeIds(nodes, edges) {
  if (nodes.length === 0) return new Set();

  const nodeIds = nodes.map((n) => n.id);
  const nodeSet = new Set(nodeIds);
  const adj = {};
  const inDegree = {};

  for (const id of nodeIds) {
    adj[id] = [];
    inDegree[id] = 0;
  }

  for (const { source, target } of edges) {
    if (nodeSet.has(source) && nodeSet.has(target)) {
      adj[source].push(target);
      inDegree[target] += 1;
    }
  }

  const queue = nodeIds.filter((id) => inDegree[id] === 0);
  const processed = new Set();

  while (queue.length > 0) {
    const node = queue.shift();
    processed.add(node);
    for (const neighbor of adj[node]) {
      inDegree[neighbor] -= 1;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  const cycleNodes = new Set(nodeIds.filter((id) => !processed.has(id)));

  return new Set(
    edges
      .filter((e) => cycleNodes.has(e.source) && cycleNodes.has(e.target))
      .map((e) => e.id)
  );
}
