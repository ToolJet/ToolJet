// shadcn/ui pack: the summary strip's figures (SummaryStrip.jsx), pure as sectionsModel.js: every function takes
// whatever the author bound and never throws.
import { formatter, num } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { VALUE_FORMATS, formatValue, isText, shown } from './sectionsModel';

export const MAX_FIGURES = 6;
const DELTA_FORMATS = ['percent', 'number', 'currency'];
const TONES = {
  positive: 'positive',
  good: 'positive',
  success: 'positive',
  negative: 'negative',
  bad: 'negative',
  danger: 'negative',
  neutral: 'neutral',
};

/** A change: a number signed and formatted (12.5 shows +12.5% as a percent), or text as written ('+3 this week'). Its
 *  direction is its sign (a leading +, -, or an arrow for text). */
const deltaOf = (delta, format, currency) => {
  if (delta === null || delta === undefined || typeof delta === 'object' || delta === '') return null;
  const n = typeof delta === 'number' ? (Number.isFinite(delta) ? delta : null) : num(delta);
  if (typeof delta === 'number' || (n !== null && /^[+-]?[\d.,\s]+$/.test(String(delta).trim()))) {
    if (n === null) return null;
    const kind = DELTA_FORMATS.includes(format) ? format : 'percent';
    const body = formatter({ format: kind, currency })(Math.abs(n));
    return {
      text: `${n > 0 ? '+' : n < 0 ? '−' : ''}${body}`,
      direction: Math.sign(n),
    };
  }
  const text = String(delta).trim();
  const direction = /^[+↑▲]/.test(text) ? 1 : /^[-−↓▼]/.test(text) ? -1 : 0;
  return { text, direction };
};

// valueFormat 'auto' reads a figure's label: money words show currency, anything else a grouped number (a rooms strip
// whose format was 'currency' showed "$8" meeting rooms).
const MONEY_LABEL =
  /\b(revenue|spend|spent|cost|costs|amount|sales|budget|price|paid|income|profit|invoices?|balance|fees?|payouts?|takings|earnings|mrr|arr|ltv|aov|left to spend|refunds? (?:issued|total|value)|average (?:order|ticket|invoice|basket|sale|spend)|avg\.? (?:order|ticket|invoice|basket|sale|spend))\b/i;
const NOT_MONEY_LABEL = /\b(rate|count|number of|percent|share|ratio)\b|%/i;
// A money word beside a count or a change is not money ("Sales calls", "Paid users", "Invoices sent", "Revenue growth",
// "Budget days left"), unless the label also names a sum ("Invoices total", "Orders value").
const COUNT_OR_CHANGE_LABEL =
  /\b(calls|users|customers|clients|accounts|people|members|seats|units|items|orders|invoices|sent|issued|emails|tickets|leads|deals|visits|sessions|days|hours|minutes|weeks|months|growth|margin|change|increase|decrease|trend|uplift)\b/i;
const SUM_LABEL = /\b(total|totals|value|amount|sum|balance)\b/i;
const autoFigureFormat = (label, value) =>
  isText(label) &&
  MONEY_LABEL.test(label) &&
  !NOT_MONEY_LABEL.test(label) &&
  (!COUNT_OR_CHANGE_LABEL.test(label) || SUM_LABEL.test(label)) &&
  Number.isFinite(Number(value))
    ? 'currency'
    : 'auto';

/** The figures of a summary strip, at most MAX_FIGURES: { label, value, delta: { text, tone }, caption } from
 *  [{ label, value, format, delta, deltaFormat, tone, lowerIsBetter, caption }]. value formats in the item's format,
 *  else the strip's valueFormat. A delta's tone is the item's tone ('positive', 'negative', 'neutral'), else its
 *  direction (up is positive, down negative; lowerIsBetter flips them). Plain values ('Revenue') are taken as figures
 *  without a label. Entries that are neither are dropped. */
export const summaryFigures = (items, { valueFormat = 'auto', currency, deltaFormat = 'percent' } = {}) => {
  if (!Array.isArray(items)) return [];
  return items
    .flatMap((item, index) => {
      if (item === null || item === undefined || Array.isArray(item)) return [];
      if (typeof item !== 'object') {
        const value = shown(item);
        return value ? [{ key: String(index), label: '', value, delta: null, caption: '' }] : [];
      }
      const format = VALUE_FORMATS.includes(item.format)
        ? item.format
        : valueFormat === 'auto'
        ? autoFigureFormat(item.label, item.value)
        : valueFormat;
      const itemCurrency = isText(item.currency) ? item.currency : currency;
      const delta = deltaOf(item.delta, isText(item.deltaFormat) ? item.deltaFormat : deltaFormat, itemCurrency);
      let tone = TONES[isText(item.tone) ? item.tone.trim().toLowerCase() : ''];
      if (delta && !tone) {
        const dir = item.lowerIsBetter === true ? -delta.direction : delta.direction;
        tone = dir > 0 ? 'positive' : dir < 0 ? 'negative' : 'neutral';
      }
      return [
        {
          key: String(index),
          label: shown(item.label),
          value: formatValue(item.value, format, itemCurrency),
          delta: delta ? { ...delta, tone } : null,
          caption: shown(item.caption),
        },
      ];
    })
    .slice(0, MAX_FIGURES);
};

/** Figures per row in a strip this wide: all of them when each gets minWidth, else as many as fit, at least one. */
export const stripColumns = (count, width, minWidth = 140) => {
  const n = Math.max(1, Math.floor(Number(count)) || 1);
  const fit = Math.max(1, Math.floor((Number(width) || 0) / minWidth));
  return Math.min(n, fit);
};
