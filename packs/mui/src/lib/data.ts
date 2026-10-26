// Values arrive from the Inspector as arbitrary JSON (or a JSON string); these keep only well-formed shapes.

export type Row = Record<string, unknown>;

export const toArray = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// The records of a list component: an array (or its JSON text), as the Ant and shadcn lists take it, and also a query
// result bound whole: an object holding the records under data, rows, items, records or results (a REST or JS query's
// { rows: [...] }).
const RECORD_KEYS = ['data', 'rows', 'items', 'records', 'results'];
export const recordsOf = (raw: unknown): unknown[] => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const key = RECORD_KEYS.find((k) => Array.isArray((raw as Record<string, unknown>)[k]));
    return key ? ((raw as Record<string, unknown>)[key] as unknown[]) : [];
  }
  return toArray(raw);
};

export const toRows = (raw: unknown): Row[] =>
  toArray(raw).map((r) => (r && typeof r === 'object' && !Array.isArray(r) ? (r as Row) : { value: r }));

export const str = (v: unknown): string => (v === undefined || v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));

export type Option = { label: string; value: string; disabled?: boolean };

/** MUI's option shape, [{ label, value, disabled }]; plain strings become both. */
export const toOptions = (raw: unknown): Option[] =>
  toArray(raw)
    .map((o) => {
      if (typeof o === 'string' || typeof o === 'number') return { label: String(o), value: String(o) };
      if (!o || typeof o !== 'object') return null;
      const r = o as Row;
      const value = str(r.value ?? r.key ?? r.label);
      return { label: str(r.label ?? r.title ?? r.value), value, disabled: Boolean(r.disabled) };
    })
    .filter((o): o is Option => !!o && o.value !== '');

// Each item is a tab or section with its own canvas: a binding to a large list (a table's rows by mistake) drew
// 1500 canvases and froze the page (pack fuzz, 2026-10-23). Layouts never need more than this.
export const MAX_SLOT_ITEMS = 50;

/** Items with a key and a label: { value, label }, also { key, label }, { id, label } or strings. */
export const toKeyedItems = (raw: unknown): { key: string; label: string; disabled?: boolean }[] =>
  toArray(raw)
    .slice(0, MAX_SLOT_ITEMS)
    .map((o) => {
      if (typeof o === 'string') return { key: o, label: o };
      if (!o || typeof o !== 'object') return null;
      const r = o as Row;
      const key = str(r.key ?? r.id ?? r.value ?? r.label);
      return { key, label: str(r.label ?? r.title ?? key), disabled: Boolean(r.disabled) };
    })
    .filter((o): o is { key: string; label: string; disabled?: boolean } => !!o && o.key !== '');

/** A row's identity: the named field, else id / key, else the index. */
export const rowKeyOf = (row: Row, field: string, index: number): string => {
  const v = row[field] ?? row.id ?? row.key;
  return v === undefined || v === null || v === '' ? String(index) : String(v);
};

/** A field read by dataIndex, which may be a dotted path ('customer.name'). */
export const readField = (row: Row, dataIndex: string): unknown =>
  dataIndex.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Row)[k] : undefined), row);

// A short, stable tag of an id's exact text (FNV-1a), in slot-name characters.
const idTag = (id: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
};

const toSlotName = (prefix: string, id: string) => `${prefix}_${id.replace(/[^A-Za-z0-9_]/g, '_')}`;

/** Each distinct item id's slot name (letters, digits and underscores, as a canvas id needs). Folding every other
 *  character to '_' gave 'a-b' and 'a_b' one canvas: the second tab drew blank and its components went to the first
 *  (shadcn pack audit SP-18, 2026-10-23). Names stay exactly the folded ones unless ids collide, so saved apps keep their
 *  dropped components; on a collision an id already in slot characters keeps the plain name, as does the first of the
 *  others in text order (never list order: reordering items must not swap their canvases), and the rest get a tag of
 *  their own id. */
export const slotNames = (prefix: string, ids: string[]): Map<string, string> => {
  const names = new Map<string, string>();
  const taken = new Set<string>();
  const distinct = [...new Set(ids)];
  const plain = distinct.filter((id) => /^[A-Za-z0-9_]*$/.test(id));
  const folded = distinct.filter((id) => !/^[A-Za-z0-9_]*$/.test(id)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const id of plain) {
    names.set(id, toSlotName(prefix, id));
    taken.add(toSlotName(prefix, id));
  }
  for (const id of folded) {
    const base = toSlotName(prefix, id);
    let name = base;
    for (let n = 1; taken.has(name); n += 1) name = `${base}_${idTag(id)}${n > 1 ? `_${n}` : ''}`;
    names.set(id, name);
    taken.add(name);
  }
  return names;
};

/** A row's own id value (a number stays a number), as the app wrote it; the index when the row has none. */
export const rowIdOf = (row: Row, field: string, index: number): unknown => {
  const v = row[field] ?? row.id ?? row.key;
  return v === undefined || v === null || v === '' ? index : v;
};

/** Whether two exposed records are the same data, so a refresh that changed nothing publishes nothing. */
export const sameRecord = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};
