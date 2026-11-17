// UI 2.0's options model (Ui2/_shared/packHooks toOptions, Ui2/_pickers/pickersModel) for the choice components:
// plain values or { label, value, description?, icon?, group?, disabled? }. Values keep their type (1 stays a number
// in the exposed value); a selection is stored by key, the value as text, so '1' typed into a default still names the
// option 1. Two options whose values share that text in different types (1 and '1') are two choices: the later type's
// key carries its type (optionKey), and a wanted value finds the option of its own type first (keyForValue). Options
// with the very same value are one choice drawn twice: every row shows, they select together (selecting is by value),
// and the component warns once in the console.

export type OptionValue = string | number | boolean;

export interface ChoiceOption {
  label: string;
  value: OptionValue;
  description?: unknown;
  icon?: unknown;
  group?: unknown;
  disabled?: unknown;
  [key: string]: unknown;
}

export const isScalar = (v: unknown): v is OptionValue =>
  typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)) || typeof v === 'boolean';

export const list = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export const text = (v: unknown): string => (isScalar(v) ? String(v) : '');

// The type an option's key carries, set by toChoiceOptions on an option whose value's text an earlier option holds in
// another type. Kept beside the option, so an author's own fields on it are never touched.
const TYPED_KEY = new WeakMap<object, string>();
const warned = new Set<string>();

const warnDuplicate = (widget: string, value: OptionValue) => {
  const message = `${widget}: more than one option has the value ${JSON.stringify(value)}; they are drawn and selected as one value.`;
  if (warned.has(message)) return;
  if (warned.size >= 100) warned.clear();
  warned.add(message);
  console.warn(message);
};

/** Options as { label, value }: plain values as well as objects. Entries that cannot be an option are dropped and a
 *  missing label falls back to the value. Every option is kept: see the header for options sharing a value. */
export const toChoiceOptions = (v: unknown, widget = 'Options'): ChoiceOption[] => {
  const firstType = new Map<string, string>();
  const seen = new Set<string>();
  const out: ChoiceOption[] = [];
  for (const o of list(v)) {
    let option: ChoiceOption;
    if (isScalar(o)) option = { label: String(o), value: o };
    else if (o && typeof o === 'object' && !Array.isArray(o)) {
      const entry = o as Record<string, unknown>;
      const value = entry.value !== undefined && entry.value !== null ? entry.value : entry.label;
      if (!isScalar(value)) continue;
      option = { ...entry, label: isScalar(entry.label) ? String(entry.label) : String(value), value };
    } else continue;
    const text = keyOf(option.value);
    const type = typeof option.value;
    const first = firstType.get(text);
    if (first === undefined) firstType.set(text, type);
    else if (first !== type) TYPED_KEY.set(option, `\u0001${type}`);
    const exact = `${type}:${text}`;
    if (seen.has(exact)) warnDuplicate(widget, option.value);
    else seen.add(exact);
    out.push(option);
  }
  return out;
};

export const keyOf = (v: unknown): string => String(v);

/** The key an option is selected by: its value's key (keyOf, or a component's own such as choiceKey), with its type
 *  added when an earlier option holds the same text in another type. Options with the same value share it. */
export const optionKey = (o: ChoiceOption, base: (v: unknown) => string = keyOf): string =>
  base(o.value) + (TYPED_KEY.get(o) ?? '');

/** The key a wanted value selects: the option with exactly that value (type included) first, else the value's key, so
 *  the text '1' still picks the option 1. */
export const keyForValue = (options: readonly ChoiceOption[], v: unknown, base: (v: unknown) => string = keyOf): string => {
  const exact = options.find((o) => o.value === v);
  return exact ? optionKey(exact, base) : base(v);
};

/** The first option of each key (options with the same value share one), for looking an option up by key. */
export const optionsByKey = (options: readonly ChoiceOption[], base: (v: unknown) => string = keyOf): Map<string, ChoiceOption> => {
  const map = new Map<string, ChoiceOption>();
  for (const o of options) {
    const k = optionKey(o, base);
    if (!map.has(k)) map.set(k, o);
  }
  return map;
};

/** React keys for a list of choice keys: a key that repeats (options with the same value) gets its count. */
export const uniqueKeys = (keys: readonly string[]): string[] => {
  const count = new Map<string, number>();
  return keys.map((k) => {
    const n = count.get(k) ?? 0;
    count.set(k, n + 1);
    return n ? `${k}\u0002${n}` : k;
  });
};

/** A Select, Radio group or Toggle group keys "nothing chosen" as ''. '' is also a valid option value (an "All"
 *  choice), so that option has a key of its own (Radix refuses an item keyed ''). */
export const EMPTY_OPTION_KEY = '\u0000empty';

export const choiceKey = (v: unknown): string => (String(v) === '' ? EMPTY_OPTION_KEY : String(v));

/** The key a Select, Radio group or Toggle group starts on: its default value's key, '' for none. Given the options, the
 *  option of the value's own type first (keyForValue). */
export const defaultKey = (v: unknown, options?: readonly ChoiceOption[]): string =>
  v === '' || v === undefined || v === null || !isScalar(v) ? '' : options ? keyForValue(options, v, choiceKey) : choiceKey(v);

/** The author disabled it (`disabled`, or the native `disable`). */
export const isDisabledOption = (o: ChoiceOption | undefined): boolean => o?.disabled === true || o?.disable === true;

/** The key a default value starts on: null for nothing (empty, or not a text value). */
export const initialKey = (v: unknown, options?: readonly ChoiceOption[]): string | null =>
  v === undefined || v === null || v === '' || !isScalar(v) ? null : options ? keyForValue(options, v) : keyOf(v);

/** Values as a list: an array as is, one value as a list of one, nothing as []. */
export const toValueList = (v: unknown): OptionValue[] => {
  if (Array.isArray(v)) return v.filter(isScalar);
  return v === undefined || v === null || v === '' || !isScalar(v) ? [] : [v];
};

/** A whole number between lo and hi, `fallback` for junk. */
export const clampInt = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = Math.round(Number(v));
  return v === null || v === '' || typeof v === 'boolean' || !Number.isFinite(n) ? fallback : Math.min(hi, Math.max(lo, n));
};

/** A selection limit: 0 means none. */
export const clampLimit = (v: unknown): number => clampInt(v, 0, 10000, 0);

export interface OptionEntry {
  option: ChoiceOption;
  index: number;
}

export interface OptionGroup {
  heading: string;
  items: OptionEntry[];
}

/** The most options a Combobox or Multiselect list draws at once: search still runs over all of them. */
export const MAX_SHOWN_OPTIONS = 200;

/** Options matching the search text (label, description, value or group; case-insensitive). */
export const filterOptions = (options: ChoiceOption[], search: unknown): OptionEntry[] => {
  const q = String(search ?? '').trim().toLowerCase();
  const all = options.map((option, index) => ({ option, index }));
  if (!q) return all;
  return all.filter(({ option }) =>
    [option.label, option.description, option.value, option.group].some((f) => isScalar(f) && String(f).toLowerCase().includes(q))
  );
};

/** Entries grouped by the option's `group`, in order of first appearance; ungrouped ones under ''. */
export const groupOptions = (entries: OptionEntry[]): OptionGroup[] => {
  const groups: OptionGroup[] = [];
  const byName = new Map<string, OptionGroup>();
  for (const entry of entries) {
    const heading = isScalar(entry.option.group) ? String(entry.option.group) : '';
    let group = byName.get(heading);
    if (!group) {
      group = { heading, items: [] };
      byName.set(heading, group);
      groups.push(group);
    }
    group.items.push(entry);
  }
  return groups;
};

/** Multiselect keys after adding `values`: unknown or disabled values ignored when options are known, at most `limit`. */
export const addKeys = (keys: string[], values: unknown, options: ChoiceOption[], limit = 0): string[] => {
  const next = [...keys];
  for (const v of toValueList(values)) {
    const key = keyForValue(options, v);
    if (next.includes(key)) continue;
    const option = options.find((o) => optionKey(o) === key);
    if (options.length && (!option || isDisabledOption(option))) continue;
    if (limit > 0 && next.length >= limit) break;
    next.push(key);
  }
  return next;
};

export const removeKeys = (keys: string[], values: unknown, options: readonly ChoiceOption[] = []): string[] => {
  const drop = new Set(toValueList(values).map((v) => keyForValue(options, v)));
  return keys.filter((k) => !drop.has(k));
};

/** The selected options, one per key: in option order, or, with server-side search (`kept`), in the order picked, a
 *  selected option off the current result page keeping the record it had when last seen. */
export const keptOptions = (options: ChoiceOption[], keys: string[], kept: Map<string, ChoiceOption> | null): ChoiceOption[] => {
  const here = optionsByKey(options);
  if (!kept) {
    const set = new Set(keys);
    return [...here].filter(([k]) => set.has(k)).map(([, o]) => o);
  }
  return keys.flatMap((k) => {
    const o = here.get(k) ?? kept.get(k);
    return o ? [o] : [];
  });
};

/** The value an action argument names: a value, or an { value } object. */
export const wantedValue = (v: unknown): unknown =>
  v && typeof v === 'object' && !Array.isArray(v) && 'value' in v ? (v as { value: unknown }).value : v;

/** The options a radio or toggle group draws: the first `max`, plus the selected one wherever it is. */
export const shownOptions = <T>(options: T[], selected: T | undefined, max: number): T[] => {
  const shown = options.slice(0, max);
  if (selected && !shown.includes(selected)) shown.push(selected);
  return shown;
};

/** Radios and toggle buttons are laid out on the widget: past this many, a bound list is a mistake. */
export const MAX_CHOICES = 100;
