import { localeFor, numberFormat } from './locale';

export type ValueFormat = 'number' | 'currency' | 'percent' | 'compact' | 'auto';

interface FormatOptions {
  format?: string;
  currency?: string;
  locale?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/** The author's prefix and suffix around a formatted figure, each left out when the format already wrote it: a "$"
 *  prefix on a currency figure read "$$1.2K", a "%" suffix on a percent "42%%". On a currency figure the mark counts
 *  anywhere ("1.200 $" in German); otherwise only at that end of the figure. */
export const withAffixes = (out: string, prefix: unknown, suffix: unknown, currency = false): string => {
  const unsigned = out.replace(/^[-\u2212+]/, '');
  const keep = (affix: unknown, written: (mark: string) => boolean): string => {
    if (typeof affix !== 'string' && typeof affix !== 'number') return '';
    const text = String(affix);
    const mark = text.trim();
    return mark && (written(mark) || (currency && out.includes(mark))) ? '' : text;
  };
  return `${keep(prefix, (m) => unsigned.startsWith(m))}${out}${keep(suffix, (m) => out.endsWith(m))}`;
};

// Shared number formatting for charts, stats and lists: Intl-based, with author prefix/suffix.
export const formatValue = (value: unknown, options: FormatOptions = {}): string => {
  const { format = 'number', currency = 'USD', prefix = '', suffix = '', decimals } = options;
  const locale = localeFor(currency, options.locale);
  const n = typeof value === 'number' ? value : Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(n)) return String(value ?? '');
  const digits = decimals === undefined ? {} : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  let out: string;
  try {
    switch (format) {
      case 'currency':
        out = numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0, ...digits }).format(n);
        break;
      case 'percent':
        out = numberFormat(locale, { style: 'percent', maximumFractionDigits: 1, ...digits }).format(Math.abs(n) > 1 ? n / 100 : n);
        break;
      case 'compact':
        out = numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
        break;
      case 'auto':
        out = numberFormat(locale, { notation: Math.abs(n) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
        break;
      default:
        out = numberFormat(locale, { maximumFractionDigits: 2, ...digits }).format(n);
    }
  } catch {
    out = String(n);
  }
  return withAffixes(out, prefix, suffix, format === 'currency');
};
