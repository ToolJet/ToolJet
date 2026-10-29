// The locale a figure is written in, shared by every number formatter in the pack (Stat, charts, Summary strip, Record
// list, Progress list, Map popups). An author's locale wins; else the currency's home locale (BRL writes "R$ 8.799,00",
// not "R$8,799"); else en-US, so apps that set neither keep the look they had.

/** The locale each currency is most often written in. Currencies not listed fall back to en-US. */
export const CURRENCY_LOCALES: Readonly<Record<string, string>> = {
  USD: 'en-US',
  CAD: 'en-CA',
  AUD: 'en-AU',
  NZD: 'en-NZ',
  GBP: 'en-GB',
  INR: 'en-IN',
  SGD: 'en-SG',
  HKD: 'en-HK',
  ZAR: 'en-ZA',
  PHP: 'en-PH',
  EUR: 'de-DE',
  CHF: 'de-CH',
  BRL: 'pt-BR',
  MXN: 'es-MX',
  ARS: 'es-AR',
  CLP: 'es-CL',
  COP: 'es-CO',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  KRW: 'ko-KR',
  IDR: 'id-ID',
  MYR: 'ms-MY',
  THB: 'th-TH',
  VND: 'vi-VN',
  TRY: 'tr-TR',
  PLN: 'pl-PL',
  CZK: 'cs-CZ',
  HUF: 'hu-HU',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  ILS: 'he-IL',
  AED: 'en-AE',
};

const DEFAULT_LOCALE = 'en-US';

/** The inspector hint on every component's Locale field. */
export const LOCALE_HINT = 'Number and currency format, like pt-BR; empty follows the currency';

/** An author's locale as Intl writes it ("pt-br" as "pt-BR"), or '' when blank or not a locale. */
const usableLocale = (locale: unknown): string => {
  if (typeof locale !== 'string' || !locale.trim()) return '';
  try {
    const [canonical] = Intl.getCanonicalLocales(locale.trim());
    return canonical && Intl.NumberFormat.supportedLocalesOf(canonical).length ? canonical : '';
  } catch {
    return '';
  }
};

/** The locale to write a figure in: the author's locale, else the currency's (BRL pt-BR, EUR de-DE), else en-US. */
export const localeFor = (currency?: unknown, locale?: unknown): string => {
  const own = usableLocale(locale);
  if (own) return own;
  const code = typeof currency === 'string' ? currency.trim().toUpperCase() : '';
  return CURRENCY_LOCALES[code] || DEFAULT_LOCALE;
};

/** Money digits for a figure: English locales keep their whole-amount look ("$8,799", cents only when it has them);
 *  others write the currency's own decimals ("R$ 8.799,00", "¥8,799"), as their finance screens do. */
export const moneyDigits = (n: number, locale: string): Intl.NumberFormatOptions => {
  if (!/^en(-|$)/i.test(locale)) return {};
  return Number.isInteger(n) ? { minimumFractionDigits: 0, maximumFractionDigits: 2 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
};

/** The currency to format money in. None set means USD. A set value that is not a three-letter code (a typo like "US
 *  Dollar") is null, so the amount shows without a symbol, and warns once, rather than quietly showing dollars (team
 *  testing, 2026-10-29). */
const warnedCurrencies = new Set<string>();
export const currencyCode = (currency: unknown): string | null => {
  if (currency === undefined || currency === null || (typeof currency === 'string' && !currency.trim())) return 'USD';
  const code = String(currency).trim();
  if (/^[A-Za-z]{3}$/.test(code)) return code.toUpperCase();
  if (!warnedCurrencies.has(code)) {
    warnedCurrencies.add(code);
    console.warn(`Currency "${code}" is not a three-letter ISO code such as USD or EUR; showing the amount without a symbol.`);
  }
  return null;
};

/** Number format options for money in `code` (currencyCode); a null code formats a plain amount with up to two decimals. */
export const moneyStyle = (code: string | null, options: Intl.NumberFormatOptions = {}): Intl.NumberFormatOptions =>
  code ? { style: 'currency', currency: code, ...options } : { maximumFractionDigits: 2, ...options };

// Intl.NumberFormat is costly to build, so formatters are reused, one per locale and options.
const FORMATTERS = new Map<string, Intl.NumberFormat>();
/** A cached Intl.NumberFormat. A bad currency or option falls back to the locale's plain number, then to en-US. */
export const numberFormat = (locale: string, options: Intl.NumberFormatOptions = {}): Intl.NumberFormat => {
  const key = `${locale}|${JSON.stringify(options)}`;
  let cached = FORMATTERS.get(key);
  if (!cached) {
    if (FORMATTERS.size > 300) FORMATTERS.clear();
    for (const [l, o] of [
      [locale, options],
      [locale, { maximumFractionDigits: 2 }],
      [DEFAULT_LOCALE, { maximumFractionDigits: 2 }],
    ] as [string, Intl.NumberFormatOptions][]) {
      try {
        cached = new Intl.NumberFormat(l, o);
        break;
      } catch {
        // Not usable; the next one is.
      }
    }
    cached = cached || new Intl.NumberFormat(DEFAULT_LOCALE);
    FORMATTERS.set(key, cached);
  }
  return cached;
};
