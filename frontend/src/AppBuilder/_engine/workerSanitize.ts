/**
 * Strips values that can't survive structured clone across the worker
 * boundary (Comlink's default transport). Exposed values include live
 * functions (queries.run, button.click, ...) that the engine never reads —
 * only data drives resolution — so dropping them is safe. Circular
 * references are dropped too (defensive; not expected in engine seed data)
 * rather than crashing postMessage.
 */
export function toCloneable<T>(value: T): T {
  return stripUncloneable(value, new WeakSet()) as T;
}

function stripUncloneable(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' || typeof value === 'symbol' ? undefined : value;
  }
  if (value instanceof Date || value instanceof RegExp) return value;
  if (seen.has(value)) return undefined;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => stripUncloneable(item, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'function' || typeof v === 'symbol') continue;
    out[key] = stripUncloneable(v, seen);
  }
  return out;
}
