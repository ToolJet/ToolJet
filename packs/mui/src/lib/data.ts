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
