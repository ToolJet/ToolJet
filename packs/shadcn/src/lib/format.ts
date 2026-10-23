export type ValueFormat = 'number' | 'currency' | 'percent' | 'compact' | 'auto';

interface FormatOptions {
  format?: string;
  currency?: string;
  locale?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

// Shared number formatting for charts, stats and lists: Intl-based, with author prefix/suffix.
export const formatValue = (value: unknown, options: FormatOptions = {}): string => {
  const { format = 'number', currency = 'USD', locale = 'en-US', prefix = '', suffix = '', decimals } = options;
  const n = typeof value === 'number' ? value : Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(n)) return String(value ?? '');
  const digits = decimals === undefined ? {} : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  let out: string;
  try {
    switch (format) {
      case 'currency':
        out = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0, ...digits }).format(n);
        break;
      case 'percent':
        out = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1, ...digits }).format(Math.abs(n) > 1 ? n / 100 : n);
        break;
      case 'compact':
        out = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
        break;
      case 'auto':
        out = new Intl.NumberFormat(locale, { notation: Math.abs(n) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
        break;
      default:
        out = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, ...digits }).format(n);
    }
  } catch {
    out = String(n);
  }
  return `${prefix}${out}${suffix}`;
};
