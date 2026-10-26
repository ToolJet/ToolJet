// UI 2.0's Progress list rows (the Ant and shadcn packs' lib/ui2/charts/progressModel.ts), ported for the pack: row
// figures and tones. The status words come from lib/statusTone.ts. Every function takes whatever the author bound and
// never throws.

import { localeFor, moneyDigits, numberFormat } from '../../locale';
import { chipTone } from '../../statusTone';

export type Row = Record<string, unknown>;

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const toText = (v: unknown): string => (v === null || v === undefined ? '' : typeof v === 'object' ? '' : String(v));

// ---- Tones ---------------------------------------------------------------------------------------------------------

export const PROGRESS_TONES: readonly string[] = ['success', 'warning', 'danger', 'info', 'neutral'];

const TONE_NAMES: Record<string, string> = {
  positive: 'success',
  good: 'success',
  negative: 'danger',
  bad: 'danger',
  error: 'danger',
};
const PROGRESS_WORDS: [string, RegExp][] = [
  ['danger', /\b(over|over budget|over limit|overspent|exceeded|behind|off track)\b/],
  ['success', /\b(ahead|achieved|met|hit|reached|under budget)\b/],
];

/** A row's tone from its status: a tone name, else the status's words ('On track' success, 'At risk' warning, 'Over
 *  budget' or 'Behind' danger). '' when it has none. */
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

// The pack's earlier Auto color values, read as UI 2.0's.
const AUTO_ALIASES: Record<string, string> = { higherIsBetter: 'goal', lowerIsBetter: 'limit' };

/** The tone a percentage gives under autoTone: 'goal' turns green at 100%; 'limit' (a budget, a quota) amber from
 *  80% and red over 100%. '' otherwise. */
export const autoProgressTone = (pct: number | null, mode: unknown): string => {
  if (pct === null || !Number.isFinite(pct)) return '';
  const m = typeof mode === 'string' ? AUTO_ALIASES[mode] || mode : mode;
  if (m === 'goal') return pct >= 100 ? 'success' : '';
  if (m === 'limit') return pct > 100 ? 'danger' : pct >= 80 ? 'warning' : '';
  return '';
};

// ---- Figures -------------------------------------------------------------------------------------------------------

export const PROGRESS_FORMATS: readonly string[] = ['auto', 'number', 'currency', 'percent', 'compact'];

const currencyCode = (currency: unknown): string =>
  typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim()) ? currency.trim().toUpperCase() : 'USD';

/** A number or numeric text ("42", "42%"), else null. */
export const percentOf = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
  return m ? Number(m[1]) : null;
};

/** A figure in a format: 'auto' and 'number' group the digits, 'currency' in currency (cents only when it has them),
 *  'percent' takes values in percent (42.5 shows 42.5%), 'compact' abbreviates (18.4K). A value written as percent
 *  text ("75.8%") keeps its sign under any format, as lib/format formatFigure does. */
export const formatFigure = (n: number, format: unknown, currency?: unknown, locale?: unknown, raw?: unknown): string => {
  const kind = typeof format === 'string' && PROGRESS_FORMATS.includes(format) ? format : 'auto';
  const where = localeFor(currency, locale);
  if (kind === 'percent' || (typeof raw === 'string' && raw.trim().endsWith('%'))) return `${numberFormat(where, { maximumFractionDigits: 1 }).format(n)}%`;
  if (kind === 'currency') return numberFormat(where, { style: 'currency', currency: currencyCode(currency), ...moneyDigits(n, where) }).format(n);
  if (kind === 'compact') return numberFormat(where, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  return numberFormat(where, { maximumFractionDigits: 2 }).format(n);
};

/** A percentage as a label: whole numbers as written, others to one decimal (12.5%, 33.3%). */
export const percentLabel = (pct: unknown): string =>
  typeof pct === 'number' && Number.isFinite(pct) ? `${Math.abs(pct - Math.round(pct)) < 0.05 ? Math.round(pct) : pct.toFixed(1)}%` : '';

/** A bar's width for a percentage: 0 to 100. */
export const barWidth = (pct: unknown): number => (typeof pct === 'number' && Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0);

// ---- Progress list rows ----------------------------------------------------------------------------------------------

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
  locale?: unknown;
  max?: number | null;
}

export interface ProgressEntry {
  key: string;
  row: Row;
  index: number;
}

export interface ProgressItem extends ProgressEntry {
  label: string;
  value: string;
  target: string;
  pct: number | null;
  /** The bar is a share of the list's largest value, not a percentage of anything: drawn, never printed. */
  relative: boolean;
  caption: string;
  status: string;
  tone: string;
}

/** The object rows of a list with their keys (idField, else id, else the position); a repeated id gets "~2", "~3". */
export const progressEntries = (data: unknown, idField: unknown): ProgressEntry[] => {
  if (!Array.isArray(data)) return [];
  const seen = new Map<string, number>();
  const out: ProgressEntry[] = [];
  data.forEach((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return;
    const r = row as Row;
    const id = toText(isText(idField) ? r[idField] : r.id);
    const base = id || String(index);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    out.push({ key: n === 1 ? base : `${base}~${n}`, row: r, index });
  });
  return out;
};

const firstTextField = (row: Row): string | undefined => Object.keys(row).find((k) => isText(row[k]));

/** The largest value of a list whose rows have no targets: the scale of their bars. null when rows have targets. */
export const progressMax = (entries: ProgressEntry[], f: ProgressFields): number | null => {
  if (!isText(f.valueField)) return null;
  const targetKey = f.targetField;
  if (isText(targetKey) && entries.some(({ row }) => percentOf(row[targetKey]) !== null)) return null;
  const valueKey = f.valueField;
  let max: number | null = null;
  for (const { row } of entries) {
    const v = percentOf(row[valueKey]);
    if (v !== null && (max === null || v > max)) max = v;
  }
  return max;
};

/** One drawn row: its figures formatted, its percentage and tone worked out. pct is percentField when it holds a
 *  number, else value / target; a row with a value and no target reads its value as the percentage, unless the list
 *  formats values as money or counts (then the bar is a share of the largest value). */
export const progressItem = (entry: ProgressEntry, f: ProgressFields): ProgressItem => {
  const { row } = entry;
  const format = typeof f.valueFormat === 'string' && PROGRESS_FORMATS.includes(f.valueFormat) ? f.valueFormat : 'auto';
  const labelKey = isText(f.labelField) && f.labelField in row ? f.labelField : firstTextField(row);
  const rawValue = isText(f.valueField) ? row[f.valueField] : undefined;
  const rawTarget = isText(f.targetField) ? row[f.targetField] : undefined;
  const value = percentOf(rawValue);
  const target = percentOf(rawTarget);
  let pct = isText(f.percentField) ? percentOf(row[f.percentField]) : null;
  let relative = false;
  if (pct === null && value !== null) {
    const max = typeof f.max === 'number' && Number.isFinite(f.max) ? f.max : null;
    if (target !== null) pct = target > 0 ? (value / target) * 100 : null;
    else if (max !== null && ['currency', 'number', 'compact'].includes(format)) {
      pct = max > 0 ? Math.max(0, (value / max) * 100) : null;
      relative = true;
    } else pct = value;
  }
  const status = isText(f.statusField) ? toText(row[f.statusField]).trim() : '';
  return {
    ...entry,
    label: labelKey ? toText(row[labelKey]) : '',
    value: value !== null ? formatFigure(value, format, f.currency, f.locale, rawValue) : '',
    target: target !== null ? formatFigure(target, format, f.currency, f.locale, rawTarget) : '',
    pct,
    relative,
    caption: isText(f.captionField) ? toText(row[f.captionField]).trim() : '',
    // A status that only names a tone colours the bar without a chip.
    status: status && !PROGRESS_TONES.includes(status.toLowerCase()) ? status : '',
    tone: progressTone(status) || autoProgressTone(pct, f.autoTone),
  };
};

/** The bar's thickness, px. */
export const BAR_HEIGHT: Record<string, number> = { thin: 4, default: 8, thick: 12 };
