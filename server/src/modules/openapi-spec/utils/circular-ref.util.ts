// dereferenceInternal (see openapi-spec.processor.ts) mutates schemas in place and, for a
// genuinely circular schema (e.g. Microsoft Graph's driveItem -> children -> driveItem),
// produces a REAL circular object graph - the same object reachable from itself - rather than a
// $ref placeholder. That's fine for in-memory use, but this schema ends up stored as a jsonb
// column via TypeORM: the pg driver JSON-serializes it for the bind parameter, which throws on
// a true cycle exactly like plain JSON.stringify would.
//
// Matches Postman's behavior for circular schemas: expand a self-referencing schema one level
// deep, then substitute an empty object instead of continuing to recurse - so `child`'s own
// shape is visible once, but re-entering the same schema a second time collapses to `{}`
// instead of an infinite (here: literally circular) structure.
//
// IMPORTANT: this collapses a node to `{}` the SECOND time it's seen ANYWHERE in the walk, not
// just when it's a true cycle (an active ancestor). This looks stricter than necessary for a
// plain diamond (the same non-circular sub-schema reached from two sibling branches, e.g. two
// response codes both returning the same named type) - but it's required, not cosmetic: a
// schema graph with heavy sharing and no cycles at all can still have exponentially more PATHS
// through it than distinct NODES (a classic DAG property - a chain of N "diamonds" has O(N)
// nodes but O(2^N) root-to-leaf paths). Expanding every occurrence independently - or even
// expanding once and reusing the SAME clone by reference - still leaves that many paths for
// JSON.stringify/pg's jsonb encoder to flatten, since neither has any concept of shared
// structure. Confirmed against a real Microsoft Graph spec: a single operation's response
// schema, with sharing preserved, is ~6,000 distinct objects - dereferenceInternal itself
// resolves it in 28ms - but naively walking every path through it (no identity tracking at all)
// stack-overflows, and reusing one shared clone per object still produced a JSON.stringify
// output large enough to exceed V8's max string length. Collapsing every repeat occurrence,
// cyclic or not, bounds output size to the distinct-node count instead of the path count -
// the only property that actually holds after this schema is dereferenced.
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
