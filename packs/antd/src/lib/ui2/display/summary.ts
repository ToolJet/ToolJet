// UI 2.0's summary strip figures (Ui2/_sections/summaryModel.ts and formatChange in _shared/format.ts). Every function
// takes whatever the author bound and never throws.
import { formatValue, isNonBlankString, isRecord, toText } from './lists/model';
import { localeFor, numberFormat } from '../../locale';

export const MAX_FIGURES = 6;
export const STRIP_VALUE_FORMATS = ['auto', 'number', 'currency', 'percent', 'compact', 'date'];
const ITEM_FORMATS = ['auto', 'number', 'currency', 'percent', 'compact', 'date', 'datetime'];
const DELTA_FORMATS = ['percent', 'number', 'currency'];
const TONES: Record<string, string> = {
  positive: 'positive',
  good: 'positive',
  success: 'positive',
  negative: 'negative',
  bad: 'negative',
  danger: 'negative',
  neutral: 'neutral',
};

export interface Delta {
  text: string;
  direction: number;
}

const num = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string' || !v.trim()) return null;
  const n = Number(v.replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const formatChange = (n: number, format: string, currency: unknown, locale: unknown): Delta => {
  const code = typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim()) ? currency.trim().toUpperCase() : 'USD';
  const where = localeFor(currency, locale);
  const f =
    format === 'currency'
      ? numberFormat(where, { style: 'currency', currency: code })
      : numberFormat(where, { minimumFractionDigits: format === 'percent' ? 1 : 0, maximumFractionDigits: 1 });
  const digits = f.resolvedOptions().maximumFractionDigits ?? 1;
  const shown = Math.round(Math.abs(n) * 10 ** digits) / 10 ** digits;
  const direction = shown === 0 ? 0 : Math.sign(n);
  const sign = direction > 0 ? '+' : direction < 0 ? '−' : '';
  return { text: `${sign}${f.format(shown)}${format === 'percent' ? '%' : ''}`, direction };
};

// A change: a number signed and formatted, or text as written ('+3 this week'), its direction from a leading sign.
const deltaOf = (delta: unknown, format: unknown, currency: unknown, locale: unknown): Delta | null => {
  if (delta === null || delta === undefined || typeof delta === 'object' || delta === '') return null;
  const n = num(delta);
  if (typeof delta === 'number' || (n !== null && /^[+-]?[\d.,\s]+$/.test(String(delta).trim()))) {
    if (n === null) return null;
    return formatChange(n, typeof format === 'string' && DELTA_FORMATS.includes(format) ? format : 'percent', currency, locale);
  }
  const text = String(delta).trim();
  const direction = /^[+↑▲]/.test(text) ? 1 : /^[-−↓▼]/.test(text) ? -1 : 0;
  return { text, direction };
};

// valueFormat 'auto' reads a figure's label: money words show currency, anything else a grouped number.
const MONEY_LABEL =
  /\b(revenue|spend|spent|cost|costs|amount|sales|budget|price|paid|income|profit|invoices?|balance|fees?|payouts?|takings|earnings|mrr|arr|ltv|aov|left to spend|refunds? (?:issued|total|value)|average (?:order|ticket|invoice|basket|sale|spend)|avg\.? (?:order|ticket|invoice|basket|sale|spend))\b/i;
const NOT_MONEY_LABEL = /\b(rate|count|number of|percent|share|ratio)\b|%/i;
const COUNT_OR_CHANGE_LABEL =
  /\b(calls|users|customers|clients|accounts|people|members|seats|units|items|orders|invoices|sent|issued|emails|tickets|leads|deals|visits|sessions|days|hours|minutes|weeks|months|growth|margin|change|increase|decrease|trend|uplift)\b/i;
const SUM_LABEL = /\b(total|totals|value|amount|sum|balance)\b/i;
const autoFigureFormat = (label: unknown, value: unknown): string =>
  isNonBlankString(label) &&
  MONEY_LABEL.test(label) &&
  !NOT_MONEY_LABEL.test(label) &&
  (!COUNT_OR_CHANGE_LABEL.test(label) || SUM_LABEL.test(label)) &&
  Number.isFinite(Number(value))
    ? 'currency'
    : 'auto';

export interface SummaryFigure {
  key: string;
  label: string;
  value: string;
  delta: (Delta & { tone: string }) | null;
  caption: string;
}

/** At most MAX_FIGURES figures from [{ label, value, format, delta, deltaFormat, tone, lowerIsBetter, caption }]. */
export const summaryFigures = (
  items: unknown,
  {
    valueFormat = 'auto',
    currency,
    deltaFormat = 'percent',
    locale,
  }: { valueFormat?: unknown; currency?: unknown; deltaFormat?: unknown; locale?: unknown } = {}
): SummaryFigure[] => {
  if (!Array.isArray(items)) return [];
  return items
    .flatMap((item: unknown, index: number): SummaryFigure[] => {
      if (item === null || item === undefined || Array.isArray(item)) return [];
      if (!isRecord(item)) {
        const value = toText(item);
        return value ? [{ key: String(index), label: '', value, delta: null, caption: '' }] : [];
      }
      const format =
        typeof item.format === 'string' && ITEM_FORMATS.includes(item.format)
          ? item.format
          : valueFormat === 'auto'
            ? autoFigureFormat(item.label, item.value)
            : valueFormat;
      const itemCurrency = isNonBlankString(item.currency) ? item.currency : currency;
      const itemLocale = isNonBlankString(item.locale) ? item.locale : locale;
      const delta = deltaOf(item.delta, isNonBlankString(item.deltaFormat) ? item.deltaFormat : deltaFormat, itemCurrency, itemLocale);
      let tone = TONES[isNonBlankString(item.tone) ? item.tone.trim().toLowerCase() : ''];
      if (delta && !tone) {
        const dir = item.lowerIsBetter === true ? -delta.direction : delta.direction;
        tone = dir > 0 ? 'positive' : dir < 0 ? 'negative' : 'neutral';
      }
      return [
        {
          key: String(index),
          label: toText(item.label),
          value: formatValue(item.value, format, itemCurrency, itemLocale),
          delta: delta ? { ...delta, tone } : null,
          caption: toText(item.caption),
        },
      ];
    })
    .slice(0, MAX_FIGURES);
};

/** Figures per row in a strip this wide: all of them when each gets minWidth, else as many as fit, at least one. */
export const stripColumns = (count: number, width: number, minWidth = 140): number => {
  const n = Math.max(1, Math.floor(count) || 1);
  const fit = Math.max(1, Math.floor((width || 0) / minWidth));
  return Math.min(n, fit);
};
