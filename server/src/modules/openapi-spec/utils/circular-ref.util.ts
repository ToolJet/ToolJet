// Returns a JSON-safe copy of a dereferenced schema. dereferenceInternal turns circular $refs into
// real object cycles, which fail JSON serialization into jsonb.
//
// Every repeat occurrence collapses to `{}`, not just true cycles: a shared DAG without cycles can
// still have exponentially many paths (Microsoft Graph overflowed V8's max string length), so
// output must be bounded by distinct nodes, not paths.
export function pruneCircularRefs<T>(value: T): T {
  const visited = new Set<object>();

  function walk(node: any): any {
    if (!node || typeof node !== 'object') return node;
    if (visited.has(node)) return Array.isArray(node) ? [] : {};
    visited.add(node);
    if (Array.isArray(node)) return node.map(walk);
    // A plain loop, not Object.fromEntries(Object.entries(...)): the per-node entry arrays pushed
    // peak heap on Microsoft Graph from ~1.3 GB to ~2.1 GB.
    const result: Record<string, any> = {};
    for (const key of Object.keys(node)) result[key] = walk(node[key]);
    return result;
  }

  return walk(value) as T;
}
