// Returns a JSON-safe copy of a dereferenced schema. dereferenceInternal turns circular $refs into
// real object cycles, which fail JSON serialization into jsonb.
//
// Every repeat occurrence collapses to `{}`, not just true cycles: a shared DAG without cycles can
// still have exponentially many paths (Microsoft Graph overflowed V8's max string length), so
// output must be bounded by distinct nodes, not paths.
export function pruneCircularRefs<T>(value: T): T {
  const visited = new Set<object>();

  function walk(node: any): any {
    if (Array.isArray(node)) {
      if (visited.has(node)) return [];
      visited.add(node);
      return node.map((item) => walk(item));
    }
    if (node && typeof node === 'object') {
      if (visited.has(node)) return {};
      visited.add(node);
      const result: Record<string, any> = {};
      for (const key of Object.keys(node)) {
        result[key] = walk(node[key]);
      }
      return result;
    }
    return node;
  }

  return walk(value) as T;
}
