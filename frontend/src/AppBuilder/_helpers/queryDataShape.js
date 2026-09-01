/**
 * Structure-only digest of a query's result data.
 *
 * The AI needs the *shape* of a query's output to write a transformation, but the data itself must
 * never leave the browser — see the compliance rule in the transformations spec. Everything here is
 * deliberately value-free: keys, types, nullability, array lengths and *classified* value formats
 * (`iso_date`, `unix_seconds`, …) derived by regex. No sample value is ever copied into the output.
 */

import useStore from '@/AppBuilder/_stores/store';

// REST payloads nest deeply before the interesting fields (envelope → results → row → object →
// field), so the limit has to clear that to describe a flattenable structure at all.
const MAX_DEPTH = 6;
const MAX_KEYS = 60;
const MAX_SAMPLE_ROWS = 20;

export const DATA_SHAPE_VERSION = 1;

// Format classifiers. Each receives a value and returns a label — the label goes into the digest,
// the value never does. Order matters: the first match wins.
const STRING_FORMATS = [
  ['iso_date', /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/],
  ['uuid', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i],
  ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/],
  ['url', /^https?:\/\/\S+$/i],
  ['currency_string', /^[$€£¥]\s?-?[\d,]+(\.\d+)?$/],
  ['numeric_string', /^-?\d+(\.\d+)?$/],
  ['json_string', /^\s*[[{]/],
];

const classifyString = (value) => {
  for (const [label, pattern] of STRING_FORMATS) {
    if (pattern.test(value)) return label;
  }
  return null;
};

// Unix timestamps are indistinguishable from any other number without a range check. Seconds since
// epoch for the ~1973-2033 window, and the millisecond equivalent.
const classifyNumber = (value) => {
  if (!Number.isFinite(value)) return null;
  if (Number.isInteger(value) && value >= 1e8 && value < 2e9) return 'unix_seconds';
  if (Number.isInteger(value) && value >= 1e11 && value < 2e12) return 'unix_millis';
  if (!Number.isInteger(value)) return 'float';
  return null;
};

const typeOf = (value) => {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value === 'object' ? 'object' : typeof value;
};

/**
 * Merges the node describing `value` into `existing`, so N sampled rows collapse into one node that
 * records every type/format seen across them (a column that is sometimes null stays `nullable`).
 */
const mergeNode = (existing, value, depth, state) => {
  const type = typeOf(value);

  if (!existing) {
    return describeValue(value, depth, state);
  }

  if (type === 'null') {
    return { ...existing, nullable: true };
  }

  const described = describeValue(value, depth, state);

  if (existing.type === 'null') {
    return { ...described, nullable: true };
  }
  if (existing.type !== described.type) {
    const types = new Set([...(existing.types ?? [existing.type]), described.type]);
    return { ...existing, type: 'mixed', types: [...types], nullable: existing.nullable || described.nullable };
  }

  const merged = { ...existing, nullable: existing.nullable || described.nullable };

  if (described.type === 'object') {
    const keys = { ...(existing.keys ?? {}) };
    Object.entries(described.keys ?? {}).forEach(([key, node]) => {
      keys[key] = keys[key] ? mergeKeyNode(keys[key], node) : node;
    });
    // Keys absent from this row but present in an earlier one are nullable in practice.
    Object.keys(existing.keys ?? {}).forEach((key) => {
      if (!(key in (described.keys ?? {}))) keys[key] = { ...keys[key], nullable: true };
    });
    merged.keys = keys;
  }

  if (described.type === 'array') {
    merged.length = Math.max(existing.length ?? 0, described.length ?? 0);
    merged.items = existing.items && described.items ? mergeKeyNode(existing.items, described.items) : described.items;
  }

  if (described.format && existing.format && described.format !== existing.format) {
    merged.format = null;
  } else if (!existing.format && described.format) {
    merged.format = described.format;
  }

  return merged;
};

// Merge of two already-described nodes (no source value to re-read).
const mergeKeyNode = (a, b) => {
  if (a.type === 'null') return { ...b, nullable: true };
  if (b.type === 'null') return { ...a, nullable: true };
  if (a.type !== b.type) {
    return { type: 'mixed', types: [...new Set([...(a.types ?? [a.type]), ...(b.types ?? [b.type])])] };
  }

  const merged = { ...a, nullable: Boolean(a.nullable || b.nullable) };
  if (a.type === 'object') {
    const keys = { ...(a.keys ?? {}) };
    Object.entries(b.keys ?? {}).forEach(([key, node]) => {
      keys[key] = keys[key] ? mergeKeyNode(keys[key], node) : node;
    });
    Object.keys(a.keys ?? {}).forEach((key) => {
      if (!(key in (b.keys ?? {}))) keys[key] = { ...keys[key], nullable: true };
    });
    merged.keys = keys;
  }
  if (a.type === 'array') {
    merged.length = Math.max(a.length ?? 0, b.length ?? 0);
    merged.items = a.items && b.items ? mergeKeyNode(a.items, b.items) : (a.items ?? b.items);
  }
  if (a.format !== b.format) merged.format = null;
  return merged;
};

function describeValue(value, depth, state) {
  const type = typeOf(value);

  if (depth > MAX_DEPTH) {
    state.truncated = true;
    return { type, truncated: true };
  }

  switch (type) {
    case 'array': {
      const node = { type: 'array', length: value.length };
      const sample = value.slice(0, MAX_SAMPLE_ROWS);
      if (sample.length < value.length) state.truncated = true;
      let items = null;
      sample.forEach((entry) => {
        items = items
          ? mergeKeyNode(items, describeValue(entry, depth + 1, state))
          : describeValue(entry, depth + 1, state);
      });
      if (items) node.items = items;
      return node;
    }
    case 'object': {
      const node = { type: 'object', keys: {} };
      const entries = Object.entries(value);
      if (entries.length > MAX_KEYS) state.truncated = true;
      entries.slice(0, MAX_KEYS).forEach(([key, entry]) => {
        node.keys[key] = describeValue(entry, depth + 1, state);
      });
      return node;
    }
    case 'string': {
      const format = classifyString(value);
      return { type: 'string', ...(format ? { format } : {}), ...(value.length === 0 ? { empty: true } : {}) };
    }
    case 'number': {
      const format = classifyNumber(value);
      return { type: 'number', ...(format ? { format } : {}) };
    }
    case 'null':
      return { type: 'null', nullable: true };
    default:
      return { type };
  }
}

/**
 * Builds the structure-only digest for a query result.
 *
 * @param {*} rawData Untransformed query output as it sits in the inspector.
 * @returns {object|null} Digest, or null when there is nothing to describe.
 */
export const buildDataShapeDigest = (rawData) => {
  if (rawData === undefined || rawData === null) return null;
  // An empty result is indistinguishable from "the query never ran" (the store seeds rawData to [])
  // and describes nothing useful either way — treat both as "no shape available".
  if (Array.isArray(rawData) && rawData.length === 0) return null;
  if (typeof rawData === 'object' && !Array.isArray(rawData) && Object.keys(rawData).length === 0) return null;

  const state = { truncated: false };
  let root = describeValue(rawData, 0, state);

  // Rows of an array are sampled one-by-one above; re-merge across the sample so a column that is
  // null in row 1 and a string in row 7 is reported as a nullable string rather than null.
  if (Array.isArray(rawData)) {
    let items = null;
    rawData.slice(0, MAX_SAMPLE_ROWS).forEach((row) => {
      items = mergeNode(items, row, 1, state);
    });
    root = { type: 'array', length: rawData.length, ...(items ? { items } : {}) };
  }

  return { version: DATA_SHAPE_VERSION, root, truncated: state.truncated };
};

// Placeholder each type is rendered as in the masked sample. Numbers and booleans are unquoted so
// the sample reads like the real payload; strings keep their quotes. Dates show their format instead
// of a blank mask because the format is the thing a transformation has to act on.
const MASK_BY_FORMAT = {
  iso_date: '"YYYY-MM-DDTHH:mm:ssZ"',
  unix_seconds: '**',
  unix_millis: '**',
  email: '"****"',
  uuid: '"****"',
  url: '"****"',
  currency_string: '"****"',
  numeric_string: '"****"',
  json_string: '"****"',
};

const maskNode = (node, indent) => {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);

  switch (node?.type) {
    case 'object': {
      const entries = Object.entries(node.keys ?? {});
      if (!entries.length) return '{}';
      const body = entries.map(([key, child]) => `${padInner}${key}: ${maskNode(child, indent + 1)}`).join(',\n');
      return `{\n${body}\n${pad}}`;
    }
    case 'array':
      return node.items ? `[ ${maskNode(node.items, indent)} ]` : '[]';
    case 'string':
      return MASK_BY_FORMAT[node.format] ?? '"****"';
    case 'number':
      return '**';
    case 'boolean':
      return 'true | false';
    case 'null':
      return 'null';
    default:
      return '**';
  }
};

/**
 * Renders a digest as a masked example row for display in the AI chat.
 *
 * The user is shown what the AI learned about their data — field names, types and date formats —
 * with every value masked, which is exactly what was sent. For an array result the row shape is
 * rendered rather than the array, since that is what a transformation iterates over.
 */
export const renderMaskedSample = (digest) => {
  const root = digest?.root;
  if (!root) return null;
  const node = root.type === 'array' ? root.items : root;
  if (!node) return null;
  return maskNode(node, 0);
};

/**
 * Reads a query's untransformed output from the inspector (resolved store) and digests it.
 * Returns null when the query has never run in this session.
 */
export const getQueryDataShape = (queryId, moduleId = 'canvas') => {
  if (!queryId) return null;
  const exposed = useStore.getState()?.resolvedStore?.modules?.[moduleId]?.exposedValues?.queries?.[queryId];
  if (!exposed) return null;
  // rawData is the pre-transformation payload — exactly what a transformation receives as `data`.
  const source = exposed.rawData !== undefined && exposed.rawData !== null ? exposed.rawData : exposed.data;
  return buildDataShapeDigest(source);
};
