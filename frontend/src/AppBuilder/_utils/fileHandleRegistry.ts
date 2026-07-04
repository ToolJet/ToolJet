/**
 * FileHandleRegistry — main-thread registry for large file payloads.
 *
 * Widgets that read files (FilePicker/FileInput/FileButton) register the raw
 * Blob plus its decoded string forms (text content, base64) here, and expose
 * lightweight string-like HandleRef proxies through the store instead of
 * MB-scale strings. This keeps every store write/clone, inspector render and
 * autosave/undo snapshot small.
 *
 * Materialization happens at the resolver boundary (resolveCode): any `{{ }}`
 * binding that yields a ref (or an object containing refs) is deep-hydrated to
 * real strings before the value reaches widgets or query options. Inside
 * expressions and RunJS the proxies behave like strings (`.length`, `.split`,
 * concatenation, JSON.stringify) via get-trap forwarding.
 *
 * Bytes never live in the store; the registry entry is released when the file
 * is deselected, cleared, or the owning widget unmounts.
 */

export const FILE_HANDLE_REF_MARKER = '__tjFileHandleRef';

type RegistryEntry = {
  blob?: Blob;
  fields: Record<string, string>;
};

const registry = new Map<string, RegistryEntry>();

export function registerFileHandle(handleId: string, blob: Blob | undefined, fields: Record<string, string>): void {
  registry.set(handleId, { blob, fields });
}

export function releaseFileHandle(handleId: string): void {
  registry.delete(handleId);
}

export function getFileHandleBlob(handleId: string): Blob | undefined {
  return registry.get(handleId)?.blob;
}

export function getFileHandleField(handleId: string, field: string): string {
  const entry = registry.get(handleId);
  if (!entry) return ''; // released (file deselected / widget unmounted)
  return entry.fields[field] ?? '';
}

export function registrySize(): number {
  return registry.size;
}

export function isFileHandleRef(value: unknown): boolean {
  return (
    typeof value === 'object' && value !== null && (value as Record<string, unknown>)[FILE_HANDLE_REF_MARKER] === true
  );
}

/**
 * String-like lazy reference to one field of a registered file.
 * Property access forwards to the materialized string, so `.length`,
 * `.split(...)`, template literals, `+` concatenation and JSON.stringify all
 * behave as if the real string were in place.
 */
export function createFileFieldRef(handleId: string, field: string): unknown {
  const meta: Record<string, unknown> = { [FILE_HANDLE_REF_MARKER]: true, handleId, field };
  return new Proxy(meta, {
    get(target, prop) {
      if (prop in target) return (target as Record<string | symbol, unknown>)[prop as string];
      if (prop === 'toJSON' || prop === 'toString' || prop === 'valueOf') {
        return () => getFileHandleField(handleId, field);
      }
      if (prop === Symbol.toPrimitive) {
        return () => getFileHandleField(handleId, field);
      }
      // React/immer/lodash internals probe these — never materialize for them.
      if (prop === Symbol.iterator || prop === Symbol.toStringTag || prop === '$$typeof' || prop === 'constructor') {
        return undefined;
      }
      const str = getFileHandleField(handleId, field);
      const value = (str as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(str) : value;
    },
    has(target, prop) {
      if (prop in target) return true;
      return prop in String.prototype || prop === 'length';
    },
  });
}

const MATERIALIZE_NODE_BUDGET = 5000;

function materializeInner(value: unknown, budget: { nodes: number }, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (isFileHandleRef(value)) {
    const ref = value as { handleId: string; field: string };
    return getFileHandleField(ref.handleId, ref.field);
  }
  if (seen.has(value as object)) return value;
  if (budget.nodes <= 0) return value; // give up on very large structures — refs live in small file arrays
  seen.add(value as object);

  if (Array.isArray(value)) {
    let copy: unknown[] | null = null;
    for (let i = 0; i < value.length && budget.nodes > 0; i++) {
      budget.nodes--;
      const next = materializeInner(value[i], budget, seen);
      if (next !== value[i]) {
        if (!copy) copy = [...value];
        copy[i] = next;
      }
    }
    return copy ?? value;
  }

  let objCopy: Record<string, unknown> | null = null;
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (budget.nodes <= 0) break;
    budget.nodes--;
    const next = materializeInner(obj[key], budget, seen);
    if (next !== obj[key]) {
      if (!objCopy) objCopy = { ...obj };
      objCopy[key] = next;
    }
  }
  return objCopy ?? value;
}

/**
 * Deep-replace any HandleRef inside `value` with the real string. Returns the
 * input untouched (same reference) when nothing needed materializing.
 * Fast path: zero cost while no file handles are registered.
 */
export function materializeFileHandleRefs<T>(value: T): T {
  if (registry.size === 0) return value;
  if (value === null || typeof value !== 'object') return value;
  return materializeInner(value, { nodes: MATERIALIZE_NODE_BUDGET }, new WeakSet()) as T;
}
