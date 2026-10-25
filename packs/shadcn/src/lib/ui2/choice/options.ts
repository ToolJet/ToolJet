// UI 2.0's options model (Ui2/_shared/packHooks toOptions, Ui2/_pickers/pickersModel) for the choice components:
// plain values or { label, value, description?, icon?, group?, disabled? }. Values keep their type (1 stays a number
// in the exposed value); a selection is stored by key, the value as text, so 1 and '1' name the same option.

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

/** Options as { label, value }: plain values as well as objects. Entries that cannot be an option are dropped, a missing
 *  label falls back to the value, and only the first of options sharing a value is kept. */
export const toChoiceOptions = (v: unknown): ChoiceOption[] => {
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
    const key = keyOf(option.value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(option);
  }
  return out;
};

export const keyOf = (v: unknown): string => String(v);

/** A Select, Radio group or Toggle group keys "nothing chosen" as ''. '' is also a valid option value (an "All"
 *  choice), so that option has a key of its own (Radix refuses an item keyed ''). */
export const EMPTY_OPTION_KEY = '\u0000empty';

export const choiceKey = (v: unknown): string => (String(v) === '' ? EMPTY_OPTION_KEY : String(v));

/** The key a Select, Radio group or Toggle group starts on: its default value's key, '' for none. */
export const defaultKey = (v: unknown): string => (v === '' || v === undefined || v === null || !isScalar(v) ? '' : choiceKey(v));

/** The author disabled it (`disabled`, or the native `disable`). */
export const isDisabledOption = (o: ChoiceOption | undefined): boolean => o?.disabled === true || o?.disable === true;

/** The key a default value starts on: null for nothing (empty, or not a text value). */
export const initialKey = (v: unknown): string | null =>
  v === undefined || v === null || v === '' || !isScalar(v) ? null : keyOf(v);

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
    const key = keyOf(v);
    if (next.includes(key)) continue;
    const option = options.find((o) => keyOf(o.value) === key);
    if (options.length && (!option || isDisabledOption(option))) continue;
    if (limit > 0 && next.length >= limit) break;
    next.push(key);
  }
  return next;
};

export const removeKeys = (keys: string[], values: unknown): string[] => {
  const drop = new Set(toValueList(values).map(keyOf));
  return keys.filter((k) => !drop.has(k));
};

/** The selected options: in option order, or, with server-side search (`kept`), in the order picked, a selected option
 *  off the current result page keeping the record it had when last seen. */
export const keptOptions = (options: ChoiceOption[], keys: string[], kept: Map<string, ChoiceOption> | null): ChoiceOption[] => {
  if (!kept) {
    const set = new Set(keys);
    return options.filter((o) => set.has(keyOf(o.value)));
  }
  const here = new Map(options.map((o) => [keyOf(o.value), o] as [string, ChoiceOption]));
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
