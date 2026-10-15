const STOP = Symbol('stop');
const isBoxed = (value) => value instanceof Number || value instanceof String || value instanceof Boolean;
const skipped = (item) => item === undefined || typeof item === 'function' || typeof item === 'symbol';

/**
 * `JSON.stringify(value, replacer)`, written only up to `limit` characters: `{ text, truncated }`, where `text` is the
 * start of the full JSON (undefined where JSON.stringify gives undefined). Previews of large data need only their
 * start, and the full JSON of a large dataset is hundreds of MB — past ~500 MB it can't be built at all. Circular
 * references are written as "[Circular]" instead of failing.
 */
export const stringifyBounded = (value, limit, replacer) => {
  const parts = [];
  let length = 0;
  let truncated = false;
  const emit = (text) => {
    if (length + text.length > limit) {
      parts.push(text.slice(0, limit - length));
      truncated = true;
      throw STOP;
    }
    parts.push(text);
    length += text.length;
  };
  // What JSON.stringify does to a value before writing it: toJSON, then the replacer.
  const prepare = (holder, key, item) => {
    const own =
      item !== null && typeof item === 'object' && typeof item.toJSON === 'function' ? item.toJSON(key) : item;
    return replacer ? replacer.call(holder, key, own) : own;
  };
  const ancestors = new Set();
  const write = (item) => {
    if (item === null || typeof item !== 'object' || isBoxed(item)) {
      emit(JSON.stringify(item));
      return;
    }
    if (ancestors.has(item)) {
      emit('"[Circular]"');
      return;
    }
    ancestors.add(item);
    if (Array.isArray(item)) {
      emit('[');
      for (let i = 0; i < item.length; i++) {
        if (i > 0) emit(',');
        const child = prepare(item, String(i), item[i]);
        if (skipped(child)) emit('null');
        else write(child);
      }
      emit(']');
    } else {
      emit('{');
      let first = true;
      for (const key of Object.keys(item)) {
        const child = prepare(item, key, item[key]);
        if (skipped(child)) continue;
        emit(`${first ? '' : ','}${JSON.stringify(key)}:`);
        first = false;
        write(child);
      }
      emit('}');
    }
    ancestors.delete(item);
  };

  const root = prepare({ '': value }, '', value);
  if (skipped(root)) return { text: undefined, truncated: false };
  try {
    write(root);
  } catch (error) {
    if (error !== STOP) throw error;
  }
  return { text: parts.join(''), truncated };
};

// A value with at most this many entries (array elements and object properties, at any depth) is kept whole by
// boundedSnapshot.
const SNAPSHOT_ENTRIES_WHOLE = 2000;
// Beyond that, each array or object keeps this many entries, this deep.
const SNAPSHOT_ENTRIES = 100;
const SNAPSHOT_DEPTH = 5;

// The number of entries in `value` at any depth, counted only until it is past `limit`.
const entriesUpTo = (value, limit) => {
  let count = 0;
  const seen = new Set();
  const stack = [value];
  while (stack.length && count <= limit) {
    const item = stack.pop();
    if (item === null || typeof item !== 'object' || seen.has(item)) continue;
    seen.add(item);
    if (Array.isArray(item)) {
      count += item.length;
      for (let i = 0; i < item.length && count <= limit; i++) stack.push(item[i]);
    } else {
      for (const key in item) {
        count += 1;
        stack.push(item[key]);
      }
    }
  }
  return count;
};

/**
 * `value` as kept in a debugger log: whole when small (the usual case); otherwise a bounded copy — the first
 * SNAPSHOT_ENTRIES entries of each array and object, SNAPSHOT_DEPTH deep, with a note of what was left out — so a log
 * of a failing binding to a large dataset doesn't keep the whole dataset alive.
 */
export const boundedSnapshot = (value) => {
  if (
    value === null ||
    typeof value !== 'object' ||
    entriesUpTo(value, SNAPSHOT_ENTRIES_WHOLE) <= SNAPSHOT_ENTRIES_WHOLE
  )
    return value;
  const seen = new Set();
  const copy = (item, depth) => {
    if (item === null || typeof item !== 'object') return item;
    if (seen.has(item)) return '[Circular]';
    if (depth >= SNAPSHOT_DEPTH) return Array.isArray(item) ? `[Array(${item.length})]` : '[Object]';
    seen.add(item);
    let out;
    if (Array.isArray(item)) {
      out = item.slice(0, SNAPSHOT_ENTRIES).map((entry) => copy(entry, depth + 1));
      if (item.length > SNAPSHOT_ENTRIES) out.push(`… ${item.length - SNAPSHOT_ENTRIES} more items`);
    } else {
      out = {};
      const keys = Object.keys(item);
      keys.slice(0, SNAPSHOT_ENTRIES).forEach((key) => (out[key] = copy(item[key], depth + 1)));
      if (keys.length > SNAPSHOT_ENTRIES) out['…'] = `${keys.length - SNAPSHOT_ENTRIES} more keys`;
    }
    seen.delete(item);
    return out;
  };
  return copy(value, 0);
};
