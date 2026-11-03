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

export type OptionValue = string | number | boolean;

/**
 * An option as the choice components hold it. `value` is the key it is selected by, as text (what Ant's controls hold);
 * `data` is the value as the app gave it, which the component exposes (1 stays a number); `key` is a React key of its
 * own. Two options whose values share their text in different types (1 and '1') are two choices: the later type's key
 * carries its type, and a wanted value finds the option of its own type first (keyForValue). The text '1' still picks
 * the option 1 when no option is '1'. Options with the very same value are one choice drawn twice: each keeps a React
 * key of its own, they select together, and the component warns once in the console. Ant's Select showed Text one
 * while exposing '1' and Numeric one (Codex review, 2026-10-27); the shadcn pack's lib/ui2/choice/options.ts is the
 * same contract.
 */
export type Option = { label: string; value: string; data: OptionValue; key: string; disabled?: boolean };

const warnedOptions = new Set<string>();

const warnDuplicateOption = (widget: string, value: OptionValue) => {
  const message = `${widget}: more than one option has the value ${JSON.stringify(value)}; they are drawn and selected as one value.`;
  if (warnedOptions.has(message)) return;
  if (warnedOptions.size >= 100) warnedOptions.clear();
  warnedOptions.add(message);
  console.warn(message);
};

/** Ant's options shape, [{ label, value, disabled }]; plain strings become both. See Option for the keys. */
export const toOptions = (raw: unknown, widget = 'Options'): Option[] => {
  const firstType = new Map<string, string>();
  const seen = new Map<string, number>();
  const out: Option[] = [];
  for (const o of toArray(raw)) {
    let label: string;
    let data: OptionValue;
    let disabled: boolean | undefined;
    if (typeof o === 'string' || typeof o === 'number') {
      label = String(o);
      data = o;
    } else if (o && typeof o === 'object' && !Array.isArray(o)) {
      const r = o as Row;
      const given = r.value ?? r.key ?? r.label;
      data = typeof given === 'string' || typeof given === 'number' || typeof given === 'boolean' ? given : str(given);
      label = str(r.label ?? r.title ?? r.value);
      disabled = Boolean(r.disabled);
    } else continue;
    const text = str(data);
    if (text === '') continue;
    const type = typeof data;
    const first = firstType.get(text);
    if (first === undefined) firstType.set(text, type);
    const value = first === undefined || first === type ? text : `${text}\u0001${type}`;
    const count = seen.get(value) ?? 0;
    if (count) warnDuplicateOption(widget, data);
    seen.set(value, count + 1);
    out.push({ label, value, data, key: count ? `${value}\u0002${count}` : value, ...(disabled === undefined ? {} : { disabled }) });
  }
  return out;
};

/** Options as Ant's controls take them: the key as the value, without the app's own value (Ant's list wrote it on the
 *  DOM as a `data` attribute). */
export const controlOptions = (options: readonly Option[]) =>
  options.map((o) => ({ key: o.key, label: o.label, value: o.value, disabled: o.disabled }));

/** The key a wanted value selects: the option with exactly that value (type included) first, else the value's text. */
export const keyForValue = (options: readonly Option[], v: unknown): string => {
  const exact = options.find((o) => o.data === v);
  return exact ? exact.value : str(v);
};

/** The value a picked key stands for: its option's own value (type kept), else the key itself (a typed tag). */
export const valueForKey = (options: readonly Option[], key: unknown): unknown => {
  const k = str(key);
  const o = options.find((x) => x.value === k);
  return o ? o.data : k;
};

/** An option as the component exposes it (selectedOption): { label, value, disabled }, value with its own type. */
export const exposedOption = (o: Option | undefined): Record<string, unknown> =>
  o ? { label: o.label, value: o.data, ...(o.disabled === undefined ? {} : { disabled: o.disabled }) } : {};

/** A value bound to a single choice, for keying: a scalar as it is, anything else as text. */
export const toChoiceValue = (v: unknown): OptionValue =>
  typeof v === 'string' || typeof v === 'boolean' ? v : typeof v === 'number' ? (Number.isFinite(v) ? v : '') : str(v);

// Each item is a tab or section with its own canvas: a binding to a large list (a table's rows by mistake) drew
// 1500 canvases and froze the page (pack fuzz, 2026-10-23). Layouts never need more than this.
export const MAX_SLOT_ITEMS = 50;

/** Items with a key and a label (Tabs items, Steps items): Ant's { key, label }, also { id, label } or strings. */
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
    .filter((o): o is { key: string; label: string; disabled?: boolean } => !!o && o.key !== '')
    // A repeated key is the same item (one tab, one canvas): two tabs with one key switched together.
    .filter((o, i, all) => all.findIndex((x) => x.key === o.key) === i);

/** A row's identity for Ant's rowKey: the named field, else id / key, else the index. */
export const rowKeyOf = (row: Row, field: string, index: number): string => {
  const v = row[field] ?? row.id ?? row.key;
  return v === undefined || v === null || v === '' ? String(index) : String(v);
};

/** A row's identity as the data has it, for exposing: the named field, else id / key (a number stays a number), else
 *  the index. rowKeyOf is the same as text, for matching. */
export const rowIdOf = (row: Row, field: string, index: number): unknown => {
  const v = row[field] ?? row.id ?? row.key;
  return v === undefined || v === null || v === '' ? index : v;
};

/** A field read by dataIndex, which may be a dotted path ('customer.name'). */
export const readField = (row: Row, dataIndex: string): unknown =>
  dataIndex.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Row)[k] : undefined), row);

/** A row's id as text, '' for a row without one (no named field, id or key). */
export const rowIdText = (row: Row, field: string): string => {
  const v = row[field] ?? row.id ?? row.key;
  return v === undefined || v === null || v === '' ? '' : String(v);
};

/** The ids more than one row holds, as text. */
export const repeatedIds = (ids: string[]): string[] => {
  const counts = new Map<string, number>();
  ids.forEach((id) => id !== '' && counts.set(id, (counts.get(id) ?? 0) + 1));
  return [...counts].filter(([, n]) => n > 1).map(([id]) => id);
};

const contentOf = (v: unknown): string => {
  try {
    return JSON.stringify(v) ?? '';
  } catch {
    return '';
  }
};

/** The content of each row holding `id` (as text), in order: what followSelection compares a selection against. */
export const idGroup = (rows: unknown[], ids: string[], id: string): string[] =>
  id === '' ? [] : ids.flatMap((v, i) => (v === id ? [contentOf(rows[i])] : []));

/**
 * The row a list's selection follows when its data changes. The same rule in the Ant List, the MUI List and the
 * shadcn lists (keep the copies the same).
 *
 * An id only one row holds is followed as before: a refresh exposes the record as it is now, edited or not, a reorder
 * keeps it, and a removal clears it. A repeated id is keyed by its occurrence (its first row, its second, ...), and an
 * occurrence is not a record: after a reorder the second row of an id is another record, and the selection moved to it
 * with no user action (Codex review, 2026-10-27). So while the selected id is shared (in the new data, or when it was
 * picked or last followed), the selection stays on the same record or clears:
 * - the row its key names, when that row's content is the selected record's (a refresh that changed nothing);
 * - else the one row of that id with the record's content (a reorder); more than one such row (copies) clears;
 * - else, the record was edited: the row its key names, only when the id's rows kept their places (as many rows, and
 *   none of them now holds the content another of them had); otherwise the rows moved and the selection clears.
 * Clearing exposes nothing selected and fires no event, as for a removed record.
 *
 * `ids` is each row's id as text ('' for none), `at` the row the selection's key names now (-1 for none), `id` and
 * `record` the selected record's id text and its record as last exposed, `before` the id's group (idGroup) when the
 * selection was picked or last followed. Returns the row to follow (-1 clears) and the id's group now, the next
 * `before`.
 */
export const followSelection = (p: {
  rows: unknown[];
  ids: string[];
  at: number;
  id: string;
  record: unknown;
  before: string[];
}): { index: number; group: string[] } => {
  const holders = p.id === '' ? [] : p.ids.flatMap((v, i) => (v === p.id ? [i] : []));
  const group = holders.map((i) => contentOf(p.rows[i]));
  if (group.length < 2 && p.before.length < 2) return { index: p.at, group };
  const record = contentOf(p.record);
  if (p.at >= 0 && contentOf(p.rows[p.at]) === record) return { index: p.at, group };
  const matches = holders.filter((_, n) => group[n] === record);
  if (matches.length) return { index: matches.length === 1 ? matches[0] : -1, group };
  const inPlace = group.length === p.before.length && group.every((g, n) => p.before.every((b, m) => m === n || b !== g));
  return { index: p.at >= 0 && inPlace ? p.at : -1, group };
};
