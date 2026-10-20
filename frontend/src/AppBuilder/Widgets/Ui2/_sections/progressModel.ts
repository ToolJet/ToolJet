// ToolJet UI 2.0: the progress list's rows (ProgressList.tsx), pure as sectionsModel.ts: every function takes
// whatever the author bound and never throws.
import { chipTone } from '@/AppBuilder/Widgets/Ui2/_shared/chipTone';
import { firstTextField, percentOf, uniqueKeys, type Row } from './sectionsModel';
import { FORMATS, formatValue } from '@/AppBuilder/Widgets/Ui2/_shared/format';
import { isNonBlankString, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

export const PROGRESS_TONES: readonly string[] = ['success', 'warning', 'danger', 'info', 'neutral'];
const TONE_NAMES: Record<string, string> = {
  positive: 'success',
  good: 'success',
  negative: 'danger',
  bad: 'danger',
  error: 'danger',
};
// Words a goal or a budget is described with that a status chip does not know.
const PROGRESS_WORDS: [string, RegExp][] = [
  ['danger', /\b(over|over budget|over limit|overspent|exceeded|behind|off track)\b/],
  ['success', /\b(ahead|achieved|met|hit|reached|under budget)\b/],
];

/** A row's tone from its status: a tone name ('success', 'warning', 'danger', 'info', 'neutral'), else the status's
 *  words ('On track' success, 'At risk' warning, 'Over budget' or 'Behind' danger). '' when it has none. */
export const progressTone = (status: unknown): string => {
  if (typeof status !== 'string' || !status.trim()) return '';
  const text = status.trim().toLowerCase();
  if (PROGRESS_TONES.includes(text)) return text;
  if (TONE_NAMES[text]) return TONE_NAMES[text];
  const word = PROGRESS_WORDS.find(([, re]) => re.test(text.replace(/[_-]+/g, ' ')));
  if (word && !/^not\b/.test(text)) return word[0];
  const tone = chipTone(status);
  return tone === 'neutral' ? '' : tone;
};

/** The tone a percentage gives under autoTone: 'goal' turns green at 100%; 'limit' (a budget, a quota) amber from
 *  80% and red over 100%. '' otherwise. */
export const autoProgressTone = (pct: number | null, mode: unknown): string => {
  if (pct === null || !Number.isFinite(pct)) return '';
  if (mode === 'goal') return pct >= 100 ? 'success' : '';
  if (mode === 'limit') return pct > 100 ? 'danger' : pct >= 80 ? 'warning' : '';
  return '';
};

const PROGRESS_FORMATS: readonly string[] = ['auto', ...FORMATS];

/** Rows of a progress list: { key, label, value, target, pct, caption, status, tone, row, index }. pct is percentField
 *  when it holds a number, else value / target; a row with a value and no target reads its value as the percentage.
 *  value and target show in valueFormat. The status gives the tone (a status that only names a tone shows no chip),
 *  else autoTone does. Rows that are not objects are skipped. */
/** The progress list's field properties, as bound. */
export interface ProgressFields {
  labelField?: unknown;
  valueField?: unknown;
  targetField?: unknown;
  percentField?: unknown;
  statusField?: unknown;
  captionField?: unknown;
  idField?: unknown;
  valueFormat?: unknown;
  autoTone?: unknown;
  currency?: unknown;
  /** The largest value of the list (progressMax): the scale of a bar whose row has no target and no percent. */
  max?: number | null;
}

export interface ProgressItem {
  key: string;
  label: string;
  value: string;
  target: string;
  pct: number | null;
  /** The bar is a share of the list's largest value, not a percentage of anything: drawn, never printed. */
  relative?: boolean;
  caption: string;
  status: string;
  tone: string;
  row: Row;
  index: number;
}

/** A row of the bound data with its unique key: what selection and the row count read, for every row. */
export interface ProgressEntry {
  key: string;
  row: Row;
  index: number;
}

/** The object rows of a progress list with their keys (idField, else id, else the position; repeats made unique). */
export const progressEntries = (data: unknown, fields: ProgressFields = {}): ProgressEntry[] => {
  if (!Array.isArray(data)) return [];
  const f = fields || {};
  const found = data.flatMap((row: Row, index: number) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const id = toText(isNonBlankString(f.idField) ? row[f.idField] : row.id);
    return [{ entry: { key: id || String(index), row, index }, fromId: !!id }];
  });
  return uniqueKeys(
    found.map((r) => r.entry),
    found.map((r) => r.fromId)
  );
};

/** One drawn row of a progress list: its figures formatted, its percentage and tone worked out. A list formats only
 *  the rows it draws (a 10,000-row binding formatted every row before the first 100 were shown). */
export const progressItem = ({ key, row, index }: ProgressEntry, fields: ProgressFields = {}): ProgressItem => {
  const f = fields || {};
  const format = typeof f.valueFormat === 'string' && PROGRESS_FORMATS.includes(f.valueFormat) ? f.valueFormat : 'auto';
  const numberOf = (v: unknown): number | null =>
    typeof v === 'number' ? (Number.isFinite(v) ? v : null) : percentOf(v);
  const labelKey = isNonBlankString(f.labelField) && f.labelField in row ? f.labelField : firstTextField(row);
  const rawValue = isNonBlankString(f.valueField) ? row[f.valueField] : undefined;
  const rawTarget = isNonBlankString(f.targetField) ? row[f.targetField] : undefined;
  const value = numberOf(rawValue);
  const target = numberOf(rawTarget);
  let pct = isNonBlankString(f.percentField) ? numberOf(row[f.percentField]) : null;
  // In a list with no targets, a value formatted as currency, a number or compact (revenue, a count) is drawn against
  // the list's largest one and never printed as a percentage: a top-products list with valueFormat "currency" printed
  // "529700%" beside each bar (sales dashboard, 2026-10-20). Otherwise a value with no target is the percentage.
  let relative = false;
  if (pct === null && value !== null) {
    const max = typeof f.max === 'number' && Number.isFinite(f.max) ? f.max : null;
    if (target !== null) pct = target > 0 ? (value / target) * 100 : null;
    else if (max !== null && ['currency', 'number', 'compact'].includes(format)) {
      pct = max > 0 ? Math.max(0, (value / max) * 100) : null;
      relative = true;
    } else pct = value;
  }
  const status = isNonBlankString(f.statusField) ? toText(row[f.statusField]).trim() : '';
  return {
    key,
    label: labelKey ? toText(row[labelKey]) : '',
    value: value !== null ? formatValue(value, format, f.currency) : '',
    target: target !== null ? formatValue(target, format, f.currency) : '',
    pct,
    ...(relative ? { relative } : {}),
    caption: isNonBlankString(f.captionField) ? toText(row[f.captionField]).trim() : '',
    // A status that only names a tone colours the bar without a chip.
    status: status && !PROGRESS_TONES.includes(status.toLowerCase()) ? status : '',
    tone: progressTone(status) || autoProgressTone(pct, f.autoTone),
    row,
    index,
  };
};

/** The largest value of a progress list's rows (valueField), the scale of bars that have no target. */
export const progressMax = (entries: ProgressEntry[], fields: ProgressFields = {}): number | null => {
  const f = fields || {};
  if (!isNonBlankString(f.valueField)) return null;
  // A list that has targets measures each row against its own: no list-wide scale.
  if (isNonBlankString(f.targetField) && entries.some(({ row }) => percentOf(row[f.targetField as string]) !== null || typeof row[f.targetField as string] === 'number')) return null;
  const values = entries
    .map(({ row }) => (typeof row[f.valueField as string] === 'number' ? row[f.valueField as string] : percentOf(row[f.valueField as string])))
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  return values.length ? Math.max(...values) : null;
};

/** Every row of a progress list, drawn (progressEntries, each through progressItem). */
export const progressItems = (data: unknown, fields: ProgressFields = {}): ProgressItem[] => {
  const entries = progressEntries(data, fields);
  const max = progressMax(entries, fields);
  return entries.map((entry) => progressItem(entry, { ...fields, max }));
};
