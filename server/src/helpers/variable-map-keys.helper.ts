import { camelizeKeys, decamelizeKeys } from 'humps';

const SETTINGS_KEYS = new Set(['globalSettings', 'global_settings']);

// What humps descends into. Anything else (Date, Buffer, RegExp, functions) is copied as it is.
const isTraversable = (value: unknown): value is Record<string, unknown> =>
  !!value &&
  typeof value === 'object' &&
  !(value instanceof Date) &&
  !(value instanceof RegExp) &&
  !Buffer.isBuffer(value);

/**
 * Replaces every `globalSettings.variables` map with a placeholder symbol, copying only the objects
 * on the way to one (the input is never changed). humps passes symbol values through untouched.
 */
function hideVariableMaps(value: unknown, stash: Map<symbol, unknown>): unknown {
  if (Array.isArray(value)) {
    const items = value.map((item) => hideVariableMaps(item, stash));
    return items.some((item, index) => item !== value[index]) ? items : value;
  }
  if (!isTraversable(value)) return value;
  let copy: Record<string, unknown> | null = null;
  for (const [key, child] of Object.entries(value)) {
    let next = hideVariableMaps(child, stash);
    if (SETTINGS_KEYS.has(key) && isTraversable(next) && !Array.isArray(next) && 'variables' in next) {
      const token = Symbol('variables');
      stash.set(token, next.variables);
      next = { ...next, variables: token };
    }
    if (next !== child) {
      copy ??= { ...value };
      copy[key] = next;
    }
  }
  return copy ?? value;
}

/** Puts the stashed maps back in a freshly transformed payload (humps builds new objects). */
function restoreVariableMaps(value: unknown, stash: Map<symbol, unknown>): unknown {
  if (typeof value === 'symbol' && stash.has(value)) return stash.get(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => (value[index] = restoreVariableMaps(item, stash)));
  } else if (isTraversable(value)) {
    for (const [key, child] of Object.entries(value)) value[key] = restoreVariableMaps(child, stash);
  }
  return value;
}

// Typed like humps: the result is a new object with transformed keys, not the input's type.
function keepingVariableMaps(input: object, transform: (value: object) => object): object {
  const stash = new Map<symbol, unknown>();
  const hidden = hideVariableMaps(input, stash) as object;
  const transformed = transform(hidden);
  return (stash.size ? restoreVariableMaps(transformed, stash) : transformed) as object;
}

/**
 * Declared-variable maps (`globalSettings.variables`) are keyed by variable name, a case-sensitive
 * identifier such as `selectedOrderID` or `user_name`. humps rewrites keys at every depth, which
 * would rename those variables, so app and version payloads go through these instead: the rest of
 * the payload is transformed exactly as before and each variables map is returned as stored.
 */
export const decamelizeKeysKeepingVariableMaps = (input: object): object =>
  keepingVariableMaps(input, (value) => decamelizeKeys(value));

/** See `decamelizeKeysKeepingVariableMaps`. */
export const camelizeKeysKeepingVariableMaps = (input: object): object =>
  keepingVariableMaps(input, (value) => camelizeKeys(value));
