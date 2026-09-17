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

// Maps every named schema/parameter/etc. object to its canonical document pointer (e.g.
// "#/components/schemas/UserRequest"), built ONCE per job from the pristine, pre-dereference
// spec. dereferenceInternal mutates objects in place rather than replacing them, so object
// identity survives dereferencing - a value found here still matches the same object after
// dereferenceSubtree has run. Needed because by the time markCircularRefs runs, the original
// $ref STRING that pointed at a now-live-circular object is long gone (dereferenceInternal
// already replaced every $ref with the resolved value) - this is the only way to recover a
// meaningful name instead of a locally-invented, context-free path like "#" or "#/properties/x".
export function buildRefPathIndex(spec: Record<string, any>, version: string): Map<object, string> {
  const index = new Map<object, string>();

  const record = (containerPath: string, container: Record<string, any> | undefined) => {
    if (!container || typeof container !== 'object') return;
    for (const key of Object.keys(container)) {
      const value = container[key];
      if (value && typeof value === 'object') {
        index.set(value, `${containerPath}/${key}`);
      }
    }
  };

  if (version === '3.0') {
    const components = spec.components || {};
    record('#/components/schemas', components.schemas);
    record('#/components/parameters', components.parameters);
    record('#/components/requestBodies', components.requestBodies);
    record('#/components/responses', components.responses);
    record('#/components/headers', components.headers);
  } else {
    record('#/definitions', spec.definitions);
    record('#/parameters', spec.parameters);
    record('#/responses', spec.responses);
  }

  return index;
}

// Counterpart to pruneCircularRefs for the *_raw columns: instead of truncating a repeat
// occurrence to {}, preserve it as a genuine { $ref: '<pointer>' } expression - the same
// representation dereferenceInternal itself already uses for a *direct* self-loop, just applied
// everywhere a node repeats, not only true cycles (see pruneCircularRefs for why that's
// required, not optional, at real-world scale: path count through a shared DAG can be
// exponential in node count even with zero cycles). Each distinct object is expanded exactly
// once - wherever it's reached again, cyclic or not - it becomes a $ref pointer back to that
// first expansion instead of being duplicated or re-walked. Result is JSON-safe (no live object
// cycles, no exponential duplication) and meant to be JSON.stringify'd by the caller for storage
// in a text column.
//
// Prefers refPathIndex's canonical name (e.g. "#/components/schemas/UserRequest") for the $ref
// when the repeated node is a known named schema - falls back to the locally-computed walk path
// (of its first expansion) only for an anonymous/inline schema that was never registered under
// components/definitions (rare, but not nameable any other way).
export function markCircularRefs<T>(value: T, refPathIndex?: Map<object, string>): T {
  const visited = new Map<object, string>();

  function refFor(node: object): string {
    return refPathIndex?.get(node) ?? visited.get(node)!;
  }

  function walk(node: any, path: string): any {
    if (Array.isArray(node)) {
      if (visited.has(node)) return { $ref: refFor(node) };
      visited.set(node, path);
      return node.map((item, i) => walk(item, `${path}/${i}`));
    }
    if (node && typeof node === 'object') {
      if (visited.has(node)) return { $ref: refFor(node) };
      visited.set(node, path);
      const result: Record<string, any> = {};
      for (const key of Object.keys(node)) {
        result[key] = walk(node[key], `${path}/${key}`);
      }
      return result;
    }
    return node;
  }

  return walk(value, '#') as T;
}
