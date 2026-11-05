// UI 2.0's progress widgets (Progress, Progress list, Circular progress), ported for the pack: row figures, tones,
// ring geometry and typefaces. Every function takes whatever the author bound and never throws.

import { contentKey } from '../../contentKey';
import { currencyCode, localeFor, moneyDigits, moneyStyle, numberFormat } from '../../locale';

export type Row = Record<string, unknown>;

const isSet = (v: unknown): boolean => v !== undefined && v !== null && v !== '';
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const toText = (v: unknown): string =>
  v === null || v === undefined ? '' : typeof v === 'object' ? '' : String(v);

// ---- Tones ---------------------------------------------------------------------------------------------------------

export const PROGRESS_TONES: readonly string[] = ['success', 'warning', 'danger', 'info', 'neutral'];

/** A tone as a colour of the pack's theme. Info is a fixed blue, so states stay apart whatever the brand colour. */
export const TONE_VAR: Record<string, string> = {
  success: 'var(--ant-color-success)',
  warning: 'var(--ant-color-warning)',
  danger: 'var(--ant-color-error)',
  info: 'var(--ant-color-info)',
  neutral: 'var(--ant-color-text-tertiary)',
};

// The status words a chip is toned by (UI 2.0's chipTone). Danger is checked first, so "Out of stock" is never read as
// "In stock".
const CHIP_TONES: [string, RegExp][] = [
  [
    'danger',
    /\b(overdue|out of stock|failed|failure|error|cancell?ed|rejected|declined|blocked|expired|lost|critical|urgent|high|severe|breach(ed)?|late|delayed|churned|suspended|terminated|refunded|disputed|offline|down|absent|no show|missed|out of service|churn|out of range|alerts?|alarms?|fail|lapsed|detractors?|full(?! time)|sold out)\b/,
  ],
  [
    'warning',
    /\b(pending|unpaid|due|due soon|expiring|expiring soon|waitlist|waitlisted|contraction|downgrade|reorder|low stock|waiting|awaiting|review|on hold|hold|draft|medium|at risk|risk|partial|partially paid|tentative|requested|needs attention|needs [a-z]+|follow up|warning|watch|watching|few spots|few left|passives?|almost full|nearly full|maintenance|busy|trial|missing|incomplete|in repair|repair|in workshop|workshop)\b/,
  ],
  [
    'success',
    /\b(paid|active|done|complete|completed|resolved|approved|confirmed|in stock|won|healthy|available|delivered|shipped|success|successful|passed|live|online|published|ready|accepted|vacant|clean|fulfilled|on track|closed won|signed|settled|given|attached|received|present|in service|on the road|on road|on duty|on shift|in operation|operational|operating|running|deployed|en route|on route|returned|verified|validated|cleared|expansion|upgrade|in range|within range|pass|renewed|promoters?)\b/,
  ],
  [
    'info',
    /\b(new(?! (york|zealand|delhi|jersey|mexico|hampshire|south wales|orleans|brunswick|haven|england|caledonia|guinea|westminster))|open|in progress|scheduled|booked|sent|assigned|processing|planned|upcoming|started|qualified|contacted|proposal|negotiation|checked in|in transit|on the way|en route|dispatched|on site|checked out|on loan|in use|occupied|reserved|held|flying|in flight|airborne|quoted|committed|in testing|testing|in qa|on call|on duty|out for delivery|picked up)\b/,
  ],
];

export const chipTone = (value: unknown): string => {
  if (typeof value !== 'string') return 'neutral';
  const text = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 'neutral';
  if (/^not\b/.test(text)) return CHIP_TONES[2][1].test(text.slice(3)) ? 'warning' : 'neutral';
  if (/^(in|under) review$/.test(text)) return 'info';
  if (/^(out|on hire|hired out|lent out)$/.test(text)) return 'info';
  for (const [tone, words] of CHIP_TONES) if (words.test(text)) return tone;
  return 'neutral';
};

/** A chip's text: a value all in lowercase ("in_progress") reads in sentence case ("In progress"); others as written. */
export const chipLabel = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (!/^[a-z][a-z0-9 _-]*$/.test(text)) return text;
  const words = text.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

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


/** A number or numeric text ("42", "42%"), else null. */
export const percentOf = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
  return m ? Number(m[1]) : null;
};

/** A figure in a format: 'auto' and 'number' group the digits, 'currency' in currency (cents only when it has them),
 *  'percent' takes values in percent (42.5 shows 42.5%), 'compact' abbreviates (18.4K). */
export const formatFigure = (n: number, format: unknown, currency?: unknown, locale?: unknown): string => {
  const kind = typeof format === 'string' && PROGRESS_FORMATS.includes(format) ? format : 'auto';
  const where = localeFor(currency, locale);
  if (kind === 'currency') return numberFormat(where, moneyStyle(currencyCode(currency), moneyDigits(n, where))).format(n);
  if (kind === 'compact') return numberFormat(where, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  if (kind === 'percent') return `${numberFormat(where, { maximumFractionDigits: 1 }).format(n)}%`;
  return numberFormat(where, { maximumFractionDigits: 2 }).format(n);
};

/** A percentage as a label: whole numbers as written, others to one decimal (12.5%, 33.3%). */
export const percentLabel = (pct: unknown): string =>
  typeof pct === 'number' && Number.isFinite(pct)
    ? `${Math.abs(pct - Math.round(pct)) < 0.05 ? Math.round(pct) : pct.toFixed(1)}%`
    : '';

/** A bar's width for a percentage: 0 to 100. */
export const barWidth = (pct: unknown): number =>
  typeof pct === 'number' && Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;

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
    // A row with no id is keyed by its content, not its position, so a removal leaves the selection on the same row
    // (team testing, 2026-10-29).
    const base = id || contentKey(r);
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
  const values = entries.map(({ row }) => percentOf(row[valueKey])).filter((v): v is number => v !== null);
  return values.length ? Math.max(...values) : null;
};

/** One drawn row: its figures formatted, its percentage and tone worked out. pct is percentField when it holds a
 *  number, else value / target; a row with a value and no target reads its value as the percentage, unless the list
 *  formats values as money or counts (then the bar is a share of the largest value). */
export const progressItem = (entry: ProgressEntry, f: ProgressFields): ProgressItem => {
  const { row } = entry;
  const format = typeof f.valueFormat === 'string' && PROGRESS_FORMATS.includes(f.valueFormat) ? f.valueFormat : 'auto';
  // A named field the row lacks shows blank, not another field (team testing, 2026-10-29).
  const labelKey = isText(f.labelField) ? f.labelField : firstTextField(row);
  const value = isText(f.valueField) ? percentOf(row[f.valueField]) : null;
  const target = isText(f.targetField) ? percentOf(row[f.targetField]) : null;
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
    value: value !== null ? formatFigure(value, format, f.currency, f.locale) : '',
    target: target !== null ? formatFigure(target, format, f.currency, f.locale) : '',
    pct,
    relative,
    caption: isText(f.captionField) ? toText(row[f.captionField]).trim() : '',
    // A status that only names a tone colours the bar without a chip.
    status: status && !PROGRESS_TONES.includes(status.toLowerCase()) ? status : '',
    tone: progressTone(status) || autoProgressTone(pct, f.autoTone),
  };
};

export const BAR_HEIGHT: Record<string, number> = { thin: 4, default: 8, thick: 12 };

// ---- Ring ------------------------------------------------------------------------------------------------------------

const clampCoerce = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = typeof v === 'number' ? v : isSet(v) ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

export const ringGeometry = (value: unknown, size: unknown, thickness: unknown) => {
  const s = clampCoerce(size, 16, 1000, 96);
  const t = clampCoerce(thickness, 1, s / 2, Math.max(2, Math.round(s / 12)));
  const radius = (s - t) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = clampCoerce(value, 0, 100, 0);
  return { size: s, thickness: t, radius, circumference, percent, offset: circumference * (1 - percent / 100) };
};

// ---- Typefaces -------------------------------------------------------------------------------------------------------

export const FONT_STACKS: Record<string, string> = {
  sans: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
  display: "Didot, 'Bodoni 72', 'Bodoni MT', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

/** A font-family for a typeface style: '' for the theme font, a preset's stack, or the author's own family names. */
export const fontStack = (value: unknown): string => {
  if (!isSet(value) || typeof value === 'object') return '';
  const key = String(value).trim().toLowerCase();
  if (key === 'theme') return '';
  if (FONT_STACKS[key]) return FONT_STACKS[key];
  const own = String(value)
    .replace(/[^\w\s,'"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  if (!/[A-Za-z]/.test(own)) return '';
  return /(serif|monospace|cursive|fantasy|system-ui)\s*$/.test(own) ? own : `${own}, sans-serif`;
};

/** A set style as a CSS value, else undefined (so the CSS fallback applies). */
export const css = (v: unknown): string | undefined => (isSet(v) && typeof v !== 'object' ? String(v) : undefined);
/** A set number style as px, else undefined. */
export const cssPx = (v: unknown): string | undefined =>
  isSet(v) && Number.isFinite(Number(v)) ? `${Number(v)}px` : undefined;
