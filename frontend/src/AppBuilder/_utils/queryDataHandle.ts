/**
 * Query-data handle (Phase 6 Stage 2) — a plain, cloneable marker substituted
 * for a large `queries.<id>.data`/`.rawData` array before it crosses the
 * worker postMessage boundary, so a multi-MB query result never has to be
 * structured-cloned every cascade.
 *
 * Deliberately NOT a Proxy (unlike fileHandleRegistry.ts's file-handle refs):
 * Proxies can't survive postMessage/structured-clone, and query data is
 * accessed in ways (`.filter/.map/.length`, `Array.isArray` checks, handed to
 * AG-Grid/chart libs) a Proxy over a non-array target can't satisfy anyway.
 * Instead, the worker is taught (see ResolutionEngine.ts's cascadeFrom guard)
 * to only resolve bindings that are a PURE pass-through reference to a
 * handle — anything else is left unresolved in the worker rather than risk
 * silently computing a wrong value from the handle's placeholder shape. The
 * real array is always read back from the main-thread store before a
 * write-behind ever reaches resolvedStore (see workerWriteBehind.ts) — no
 * registry needed, unlike file handles, since the data never actually left
 * the main thread.
 */

export const QUERY_DATA_HANDLE_MARKER = '__tjQueryDataHandle';

/** Below this row count, the real array is sent as-is — most query results
 *  are well under this, so this only engages for genuinely large results.
 *  Matches fileHandleRegistry.ts's MATERIALIZE_NODE_BUDGET (5000) as a
 *  starting point; unproven, not benchmarked. */
export const QUERY_DATA_HANDLE_ROW_THRESHOLD = 5000;

export interface QueryDataHandle {
  [QUERY_DATA_HANDLE_MARKER]: true;
  queryId: string;
  field: 'data' | 'rawData';
  length: number;
  isArray: boolean;
}

export function isQueryDataHandle(v: unknown): v is QueryDataHandle {
  return typeof v === 'object' && v !== null && (v as Record<string, unknown>)[QUERY_DATA_HANDLE_MARKER] === true;
}

export function createQueryDataHandle(queryId: string, field: 'data' | 'rawData', realValue: unknown): QueryDataHandle {
  return {
    [QUERY_DATA_HANDLE_MARKER]: true,
    queryId,
    field,
    length: Array.isArray(realValue) ? realValue.length : 0,
    isArray: Array.isArray(realValue),
  };
}

/** If `path` is a `queries.<id>.data`/`.rawData` binding and `value` is large
 *  enough to warrant it, returns a handle to substitute in its place —
 *  otherwise returns `value` unchanged. */
export function maybeCreateQueryDataHandle(path: string, value: unknown): unknown {
  const parts = path.split('.');
  if (parts[0] !== 'queries' || parts.length !== 3) return value;
  const field = parts[2];
  if (field !== 'data' && field !== 'rawData') return value;
  if (!Array.isArray(value) || value.length <= QUERY_DATA_HANDLE_ROW_THRESHOLD) return value;
  return createQueryDataHandle(parts[1], field, value);
}

/** Reads the real value back from the main-thread store for a handle —
 *  called just before a write-behind would otherwise write the handle
 *  placeholder itself into resolvedStore. */
export function materializeQueryDataHandle(handle: QueryDataHandle, store: any, moduleId: string): unknown {
  return store.resolvedStore?.modules?.[moduleId]?.exposedValues?.queries?.[handle.queryId]?.[handle.field];
}
