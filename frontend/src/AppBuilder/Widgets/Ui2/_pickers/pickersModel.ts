// ToolJet UI 2.0: pure logic of the pickers widgets (Combobox, Multiselect, Tags input, Rating; the
// Color picker's is in colorModel.ts, File upload's in fileModel.ts). No React here: every function takes junk (null,
// wrong types, huge numbers) without throwing.

import type { Option, OptionValue } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { clampInt, isScalar, list } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ---- Options (Combobox, Multiselect) -------------------------------------------------------------------------------

/** The key a selection is stored under: the option value as text, so 1 and '1' name the same option. */
export const keyOf = (v: unknown): string => String(v);

/** True for an option the author disabled (`disabled` or the native `disable`). */
export const isDisabledOption = (o: Option | undefined): boolean => o?.disabled === true || o?.disable === true;

/** The option whose value is `value` (by key), or undefined. */
export const findOption = (options: unknown, value: unknown): Option | undefined => {
  if (value === undefined || value === null) return undefined;
  const key = keyOf(value);
  return list<Option>(options).find((o) => keyOf(o.value) === key);
};

/** The stored key of a default value: null when nothing is selected (empty, null, or not a text value). */
export const initialKey = (v: unknown): string | null =>
  v === undefined || v === null || v === '' || !isScalar(v) ? null : keyOf(v);

/** Options matching the search text (label, description, value or group; case-insensitive). */
/** The most options a Combobox or Multiselect list draws at once: search still runs over every option, and a hint asks
 *  to type when more match (cmdk drawing 10k items froze the page). */
export const MAX_SHOWN_OPTIONS = 200;

/** An option with its index in the full list. */
export interface OptionEntry {
  option: Option;
  index: number;
}

/** A heading (the options' `group`, '' for ungrouped) and its entries. */
export interface OptionGroup {
  heading: string;
  items: OptionEntry[];
}

export const filterOptions = (options: unknown, search: unknown): OptionEntry[] => {
  const q = String(search ?? '')
    .trim()
    .toLowerCase();
  const all = list<Option>(options).map((option, index) => ({ option, index }));
  if (!q) return all;
  return all.filter(({ option }) =>
    [option.label, option.description, option.value, option.group].some(
      (field) => isScalar(field) && String(field).toLowerCase().includes(q)
    )
  );
};

/** Entries ({ option, index }) grouped by the option's `group`, groups in order of first appearance. Ungrouped options
 *  form one group with an empty heading. */
export const groupOptions = (entries: unknown): OptionGroup[] => {
  const groups: OptionGroup[] = [];
  const byName = new Map<string, OptionGroup>();
  for (const entry of list<OptionEntry>(entries)) {
    const heading = isScalar(entry?.option?.group) ? String(entry.option.group) : '';
    if (!byName.has(heading)) {
      const group = { heading, items: [] };
      byName.set(heading, group);
      groups.push(group);
    }
    byName.get(heading)?.items.push(entry);
  }
  return groups;
};

/** Values as a list: an array as is, one value as a list of one, nothing as []. */
export const toValueList = (v: unknown): OptionValue[] => {
  if (Array.isArray(v)) return v.filter((x): x is OptionValue => isScalar(x));
  return v === undefined || v === null || v === '' || !isScalar(v) ? [] : [v];
};

/** A selection limit: 0 means none. */
export const clampLimit = (v: unknown): number => clampInt(v, 0, 10000, 0);

/** Multiselect keys after adding `values` (unknown values ignored when options are known; at most `limit`). */
export const addKeys = (keys: unknown, values: unknown, options: unknown, limit = 0): string[] => {
  const known = list<Option>(options);
  const next = [...list<string>(keys)];
  for (const v of toValueList(values)) {
    const key = keyOf(v);
    if (next.includes(key)) continue;
    const option = known.find((o) => keyOf(o.value) === key);
    if (known.length && (!option || isDisabledOption(option))) continue;
    if (limit > 0 && next.length >= limit) break;
    next.push(key);
  }
  return next;
};

export const removeKeys = (keys: unknown, values: unknown): string[] => {
  const drop = new Set(toValueList(values).map(keyOf));
  return list<string>(keys).filter((k) => !drop.has(k));
};

/** The options a multiselect shows as selected, in option order. */
export const selectedOf = (options: unknown, keys: unknown): Option[] => {
  const set = new Set(list<string>(keys));
  return list<Option>(options).filter((o) => set.has(keyOf(o.value)));
};

// ---- Tags ----------------------------------------------------------------------------------------------------------

/** Tags from a list of values or a comma-separated text: trimmed text, empties dropped. */
// A tags field past this many tags is a binding mistake (10k of them froze the page); the rest are dropped.
export const MAX_TAGS = 1000;

export const toTags = (v: unknown): string[] => {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',', MAX_TAGS * 2) : [];
  return raw
    .slice(0, MAX_TAGS * 2)
    .filter(isScalar)
    .map((t) => String(t).trim())
    .filter(Boolean);
};

/** Typed or pasted text split on commas and new lines: { parts (complete entries), rest (what is still typed) }. */
export const splitTyped = (text: unknown): { parts: string[]; rest: string } => {
  const pieces = String(text ?? '').split(/[,\n\r]/);
  const rest = pieces.pop() ?? '';
  return { parts: pieces.map((p) => p.trim()).filter(Boolean), rest };
};

/** A regular expression from the author's text, or null when it is empty, invalid or too large. V8 compiles a pattern
 *  on its first use, so it is tried once here: a huge one ("Regular expression too large") then fails here, not in
 *  render. */
export const safeRegex = (pattern: unknown): RegExp | null => {
  const source = pattern instanceof RegExp ? pattern.source : isScalar(pattern) ? String(pattern) : '';
  if (source.trim() === '' || source.length > 2000) return null;
  try {
    const re = new RegExp(source, pattern instanceof RegExp ? pattern.flags.replace('g', '') : '');
    re.test('');
    return re;
  } catch {
    return null;
  }
};

export const sameTag = (a: unknown, b: unknown, caseSensitive?: unknown): boolean =>
  caseSensitive ? String(a) === String(b) : String(a).toLowerCase() === String(b).toLowerCase();

/** Adds candidates to the tags: { tags, added, error }. Duplicates (ignoring case unless caseSensitive), tags that
 *  fail the pattern and tags past maxTags are refused, with the reason in `error`. */
/** addTags' rules: the most tags (0 for no limit), whether case tells tags apart, and the pattern a tag must match
 *  with the message shown when it does not. */
export interface TagRules {
  maxTags?: unknown;
  caseSensitive?: unknown;
  pattern?: unknown;
  patternError?: unknown;
}

export const addTags = (
  tags: unknown,
  candidates: unknown,
  { maxTags = 0, caseSensitive = false, pattern, patternError }: TagRules = {}
): { tags: string[]; added: string[]; error: string } => {
  const next = [...toTags(tags)].slice(0, MAX_TAGS);
  const added: string[] = [];
  let error = '';
  const max = clampInt(maxTags, 0, MAX_TAGS, 0) || MAX_TAGS;
  const re = safeRegex(pattern);
  // Seen tags by their compared form, so a long list is checked in one pass (sameTag's rule).
  const norm = (t: string) => (caseSensitive ? String(t) : String(t).toLowerCase());
  const seen = new Set(next.map(norm));
  for (const tag of toTags(candidates)) {
    if (seen.has(norm(tag))) {
      error = `"${tag}" is already added`;
      continue;
    }
    if (re && !re.test(tag)) {
      error = isScalar(patternError) && String(patternError).trim() ? String(patternError) : `"${tag}" is not valid`;
      continue;
    }
    if (next.length >= max) {
      error = `You can add up to ${max} tag${max === 1 ? '' : 's'}`;
      break;
    }
    seen.add(norm(tag));
    next.push(tag);
    added.push(tag);
  }
  return { tags: next, added, error };
};

// ---- Rating --------------------------------------------------------------------------------------------------------

/** The number of icons: 1 to 10, 5 when unset or junk. */
export const clampMax = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && v !== null && v !== '' ? Math.max(1, Math.min(10, n)) : 5;
};

/** A rating between 0 and max, in whole steps (or halves with allowHalf). */
export const normalizeRating = (v: unknown, max: unknown = 5, allowHalf: unknown = false): number => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const step = allowHalf ? Math.round(n * 2) / 2 : Math.round(n);
  return Math.max(0, Math.min(clampMax(max), step));
};

/** How icon `position` (1-based) draws for a value: 'full', 'half' or 'empty'. */
export const iconFill = (position: number, value: number): 'full' | 'half' | 'empty' => {
  if (value >= position) return 'full';
  if (value >= position - 0.5) return 'half';
  return 'empty';
};

/** The rating one keyboard step away (dir +1 or -1), kept between one step and max. */
export const stepRating = (value: unknown, dir: number, max: unknown = 5, allowHalf: unknown = false): number => {
  const step = allowHalf ? 0.5 : 1;
  const next = normalizeRating(value, max, allowHalf) + (dir > 0 ? step : -step);
  return Math.max(step, Math.min(clampMax(max), next));
};
