/**
 * Resolution-path caches (Phase 0a of the resolution-engine roadmap).
 *
 * 1. AST cache — `acorn.parse` is called twice per expression during dependency
 *    analysis (`_stores/ast.js`) with no memoization. Parses are deterministic
 *    (constant options) and the consumers never mutate the tree, so identical
 *    expression strings share one AST.
 *
 * 2. Compiled-function cache — every evaluation built a fresh
 *    `Function(params, 'return ' + code)`, recompiling the same expression once
 *    per ListView row and again on every cascade. The compiled function is
 *    state-independent (state arrives as call arguments), so it is cached by
 *    (parameter-list, code). The parameter list differs across the three
 *    resolveCode copies and per call when customObjects/reservedKeyword vary,
 *    hence it is part of the key.
 *
 * Both caches are bounded LRUs; entries are plain values with no closures over
 * app state, so the only cost is memory for hot expressions.
 */

class LruCache<V> {
  private map = new Map<string, V>();
  constructor(private maxSize: number) {}

  get(key: string): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      // refresh recency
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value as string;
      this.map.delete(oldest);
    }
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

const astCache = new LruCache<unknown>(2000);
const fnCache = new LruCache<(...args: unknown[]) => unknown>(2000);

/**
 * Memoized wrapper around a deterministic parse. `parse` runs on miss only.
 * Consumers must treat the returned AST as read-only (they do today).
 */
export function getCachedAst<T>(expression: string, parse: (expr: string) => T): T {
  const hit = astCache.get(expression);
  if (hit !== undefined) return hit as T;
  const ast = parse(expression);
  astCache.set(expression, ast);
  return ast;
}

/**
 * Memoized `Function(params, 'return ' + code)` compilation.
 *
 * `params` is passed to the Function constructor verbatim, so the key must
 * reproduce exactly what the constructor sees: each element stringified and
 * comma-joined (this also captures the reservedKeyword-array-as-last-param
 * trick the resolvers rely on). Compile errors are NOT cached — they propagate
 * so the caller's error handling is unchanged.
 */
export function getCompiledFn(params: unknown[], code: string): (...args: unknown[]) => unknown {
  const key = params.map((p) => String(p)).join(',') + '\u0000' + code;
  const hit = fnCache.get(key);
  if (hit) return hit;
  // Same semantics as the original `Function(paramsArray, body)` call: the
  // constructor stringifies the array, joining elements with ',' (this is also
  // what flattens the reservedKeyword array into trailing param names).
  // eslint-disable-next-line no-new-func
  const fn = Function(params.map((p) => String(p)).join(','), `return ${code}`) as (...args: unknown[]) => unknown;
  fnCache.set(key, fn);
  return fn;
}

/** Test/diagnostics hooks. */
export function clearResolverCaches(): void {
  astCache.clear();
  fnCache.clear();
}
export function resolverCacheStats(): { ast: number; fn: number } {
  return { ast: astCache.size, fn: fnCache.size };
}
