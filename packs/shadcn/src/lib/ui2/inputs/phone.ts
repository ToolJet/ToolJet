// The Phone input's countries and number logic. UI 2.0 reads them from libphonenumber (react-phone-number-input),
// which the pack does not bundle; this table holds each country's calling code and its national number lengths, enough
// for the value (E.164), the formatted number and isValidNumber.

export interface Country {
  code: string;
  dial: string;
  min: number;
  max: number;
}

// code dial min-max (national digits, no trunk 0).
const TABLE =
  'US 1 10;CA 1 10;GB 44 10;IN 91 10;AU 61 9;DE 49 10-11;FR 33 9;ES 34 9;IT 39 9-10;NL 31 9;BE 32 8-9;CH 41 9;AT 43 10-13;' +
  'IE 353 7-9;PT 351 9;SE 46 7-9;NO 47 8;DK 45 8;FI 358 6-10;PL 48 9;CZ 420 9;SK 421 9;HU 36 8-9;RO 40 9;BG 359 8-9;' +
  'GR 30 10;TR 90 10;UA 380 9;RU 7 10;IL 972 8-9;AE 971 8-9;SA 966 9;QA 974 8;KW 965 8;BH 973 8;OM 968 8;JO 962 8-9;' +
  'LB 961 7-8;EG 20 10;MA 212 9;TN 216 8;DZ 213 9;NG 234 10;GH 233 9;KE 254 9;UG 256 9;TZ 255 9;ET 251 9;ZA 27 9;' +
  'BR 55 10-11;MX 52 10;AR 54 10;CL 56 9;CO 57 10;PE 51 9;VE 58 10;EC 593 8-9;UY 598 8;PY 595 9;BO 591 8;CR 506 8;' +
  'PA 507 7-8;DO 1809 7;PR 1787 7;JM 1876 7;GT 502 8;CN 86 11;JP 81 10;KR 82 9-10;TW 886 9;HK 852 8;SG 65 8;MY 60 9-10;' +
  'ID 62 9-12;TH 66 9;VN 84 9-10;PH 63 10;PK 92 10;BD 880 10;LK 94 9;NP 977 10;NZ 64 8-10;IS 354 7;LU 352 9;MT 356 8;' +
  'CY 357 8;EE 372 7-8;LV 371 8;LT 370 8;HR 385 8-9;SI 386 8;RS 381 8-9';

export const COUNTRIES: Country[] = TABLE.split(';').map((row) => {
  const [code, dial, lengths] = row.split(' ');
  const [min, max] = lengths.split('-').map(Number);
  return { code, dial, min, max: max ?? min };
});

// Where several countries share a calling code, the one a bare '+1' or '+7' means.
const MAIN: Record<string, string> = { '1': 'US', '7': 'RU', '44': 'GB', '61': 'AU', '39': 'IT' };

const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));

export const countryOf = (code: unknown): Country | null => byCode.get(String(code ?? '').trim().toUpperCase()) ?? null;

let names: Intl.DisplayNames | null = null;
export const countryName = (c: Country): string => {
  try {
    names = names ?? new Intl.DisplayNames(['en'], { type: 'region' });
    return names.of(c.code) || c.code;
  } catch {
    return c.code;
  }
};

/** The country's flag emoji, from its two regional indicator letters. */
export const flagOf = (c: Country): string =>
  String.fromCodePoint(...[...c.code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));

/** The countries offered: `only` (ISO codes, in its order) when it names any, else all. */
export const phoneCountries = (only: unknown): Country[] => {
  const picked = (Array.isArray(only) ? only : [])
    .map(countryOf)
    .filter((c, i, all): c is Country => !!c && all.indexOf(c) === i);
  return picked.length ? picked : COUNTRIES;
};

const digitsOf = (v: unknown): string => String(v ?? '').replace(/\D/g, '');

/** The country an E.164 number belongs to: the longest calling code that starts it, among `countries`. */
export const phoneCountry = (e164: unknown, countries: Country[], prefer?: Country): Country | null => {
  const d = digitsOf(e164);
  if (!String(e164 ?? '').trim().startsWith('+') || !d) return null;
  let best: Country | null = null;
  for (const c of countries) {
    if (!d.startsWith(c.dial)) continue;
    if (!best || c.dial.length > best.dial.length) best = c;
    else if (c.dial === best.dial && (c === prefer || (MAIN[c.dial] === c.code && best !== prefer))) best = c;
  }
  return best;
};

/** The national digits of a number for `country`: an E.164 number loses its calling code, a trunk 0 is dropped. */
export const nationalOf = (v: unknown, country: Country): string => {
  const text = String(v ?? '').trim();
  let d = digitsOf(text);
  if (text.startsWith('+') && d.startsWith(country.dial)) d = d.slice(country.dial.length);
  else if (d.startsWith('0') && country.code !== 'IT') d = d.slice(1);
  return d.slice(0, 15);
};

/** The E.164 value of national digits ('' for none). */
export const toE164 = (national: string, country: Country): string => (national ? `+${country.dial}${national}` : '');

/** National digits grouped as people write them: 3-3-4 for ten digits, else blocks of three or four. */
export const groupDigits = (d: string): string => {
  if (d.length === 10) return d.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  if (d.length === 9) return d.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  if (d.length === 8) return d.replace(/(\d{4})(\d{4})/, '$1 $2');
  return d.replace(/(\d{4})(?=\d)/g, '$1 ');
};

export const isValidNational = (d: string, c: Country): boolean => d.length >= c.min && d.length <= c.max;

/** What the Phone input exposes for a number. */
export const phoneInfo = (national: string, c: Country) => ({
  value: toE164(national, c),
  country: c.code,
  countryCode: `+${c.dial}`,
  formattedValue: national ? `+${c.dial} ${groupDigits(national)}` : '',
  isValidNumber: !!national && isValidNational(national, c),
});
