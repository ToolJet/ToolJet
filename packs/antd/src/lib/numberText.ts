// Numbers as a locale writes them, read back: a copy of the Rocket pack's ui2/inputs/model.ts parseNumber and the
// helpers it needs (a pack cannot import another pack), so an Ant field reads typed text as Rocket's does.

const isBlank = (v: unknown): boolean => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

// Every numbering system Intl knows, read once from its own formatting: each digit ('٣' and '৩' are 3), its separators
// and minus sign, and the marks it writes around a number (the direction mark before an Arabic minus).
interface NumberingSystems {
  digits: Map<string, string>;
  marks: Set<string>;
}
let numbering: NumberingSystems | null = null;
const numberingSystems = (): NumberingSystems => {
  if (numbering) return numbering;
  const known: NumberingSystems = { digits: new Map(), marks: new Set() };
  const intl = Intl as { supportedValuesOf?: (key: string) => string[] };
  let systems = ['latn', 'arab', 'arabext'];
  try {
    systems = intl.supportedValuesOf?.('numberingSystem') ?? systems;
  } catch {
    // An older browser: the systems above.
  }
  for (const system of systems) {
    try {
      const parts = new Intl.NumberFormat(`en-u-nu-${system}`).formatToParts(-9876543210.5);
      const digits = Array.from(
        parts
          .filter((p) => p.type === 'integer')
          .map((p) => p.value)
          .join('')
      );
      if (digits.length === 10) digits.forEach((d, i) => known.digits.set(d, String(9 - i)));
      for (const p of parts) if (p.type === 'literal') for (const c of p.value) known.marks.add(c);
    } catch {
      // A system Intl names but cannot format with: its digits stay unread.
    }
  }
  numbering = known;
  return known;
};

/** The group and decimal separators and the minus sign of a locale ('' or an unknown locale: the browser's). */
const separators = (locale: unknown): { group: string; decimal: string; minus: string } => {
  try {
    const parts = new Intl.NumberFormat(isBlank(locale) ? undefined : String(locale)).formatToParts(-12345.6);
    return {
      group: parts.find((p) => p.type === 'group')?.value ?? ',',
      decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
      minus: parts.find((p) => p.type === 'minusSign')?.value ?? '-',
    };
  } catch {
    return { group: ',', decimal: '.', minus: '-' };
  }
};

// U+2212, the minus sign many locales write (Swedish, Finnish, Persian), is a minus in any field, as the hyphen is.
const MINUS_SIGN = '\u2212';

/** Text in ASCII digits with '-' for its minus sign: any numbering system's digits, the locale's minus sign as Intl
 *  writes it, and the direction marks around them dropped. Separators are left as typed. */
const asciiNumber = (text: string, minus: string): string => {
  const { digits, marks } = numberingSystems();
  const s = Array.from(text, (c) => (marks.has(c) ? '' : (digits.get(c) ?? c))).join('');
  return (minus && minus !== '-' ? s.split(minus).join('-') : s).split(MINUS_SIGN).join('-');
};

/** A number from text typed in a locale's format ('1,234.5', '1.234,5', '$ 12', '−1 234,5', '١٬٢٣٤٫٥'); null when
 *  there is no number. */
export const parseLocaleNumber = (v: unknown, locale?: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (isBlank(v) || typeof v !== 'string') return null;
  const { group, decimal, minus } = separators(locale);
  let s = asciiNumber(v.trim(), minus);
  const negative = /^\s*[(-]|^[^\d]*-/.test(s);
  // Spaces, no-break spaces and apostrophes are group separators in some locales.
  s = s.replace(/[\s\u00a0\u202f']/g, '');
  if (group && group.trim()) s = s.split(group).join('');
  if (decimal !== '.') s = s.split(decimal).join('.');
  s = s.replace(/[^\d.]/g, '');
  const dot = s.indexOf('.');
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
  if (!/\d/.test(s)) return null;
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
};
