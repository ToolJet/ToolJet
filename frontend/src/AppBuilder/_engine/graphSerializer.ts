/**
 * Dependency-graph serialization (Phase 2 / worker prerequisite).
 *
 * The store's graph is a class instance (`_stores/slices/DependencyClass.js`
 * wrapping `dependency-graph`) and cannot cross postMessage. The underlying
 * DepGraph stores only strings in three plain objects (`nodes`,
 * `outgoingEdges`, `incomingEdges`), so serialization is mechanical.
 */
import DependencyGraph from '@/AppBuilder/_stores/slices/DependencyClass';
import type { SerializedGraph } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** dependency-graph stores nodes/edges as Maps in current versions and plain
 *  objects in older ones — iterate either. */
function entriesOf(collection: unknown): [string, unknown][] {
  if (collection instanceof Map) return [...collection.entries()];
  return Object.entries(collection as Record<string, unknown>);
}

/** Snapshot a live DependencyGraph wrapper (or raw DepGraph) into plain data. */
export function serializeGraph(wrapper: any): SerializedGraph {
  const g = wrapper?.graph ?? wrapper; // accept wrapper or raw DepGraph
  const nodes: Record<string, unknown> = {};
  for (const [path, data] of entriesOf(g.nodes)) {
    nodes[path] = data;
  }
  const edges: [string, string][] = [];
  for (const [from, tos] of entriesOf(g.outgoingEdges)) {
    for (const to of tos as string[]) edges.push([from, to]);
  }
  return { nodes, edges };
}

/** Rebuild a DependencyGraph wrapper from serialized data (engine/worker side).
 *  Uses raw DepGraph primitives so the rebuild is exact — the wrapper's
 *  addDependency() applies path-splitting heuristics that must not re-run. */
export function deserializeGraph(serialized: SerializedGraph): any {
  const wrapper: any = new (DependencyGraph as any)();
  const g = wrapper.graph;
  for (const [path, data] of Object.entries(serialized.nodes)) {
    g.addNode(path, data);
  }
  for (const [from, to] of serialized.edges) {
    g.addDependency(from, to);
  }
  return wrapper;
}
