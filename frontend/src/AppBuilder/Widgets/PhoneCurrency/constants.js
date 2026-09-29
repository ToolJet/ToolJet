/* Supported number formats for the Currency input.
 * - `locale` drives the grouping POSITIONS via Intl.NumberFormat (the only way to get non-uniform grouping such as India's 2-2-3)
 * - `groupSeparator`/`decimalSeparator` override the CHARACTERS so we render plain ASCII instead of Intl's typographic variants.
 */
export const NUMBER_FORMATS = {
  us: { name: 'US / UK (eg. 1,234,567.89)', locale: 'en-US', groupSeparator: ',', decimalSeparator: '.' },
  eu: { name: 'European (eg. 1.234.567,89)', locale: 'de-DE', groupSeparator: '.', decimalSeparator: ',' },
  swiss: { name: "Swiss (eg. 1'234'567.89)", locale: 'de-CH', groupSeparator: "'", decimalSeparator: '.' },
  french: { name: 'French (eg. 1 234 567,89)', locale: 'fr-FR', groupSeparator: ' ', decimalSeparator: ',' },
  indian: { name: 'Indian (eg. 12,34,567.89)', locale: 'en-IN', groupSeparator: ',', decimalSeparator: '.' },
};

export const getNumberFormatConfig = (numberFormat) => NUMBER_FORMATS[numberFormat] || NUMBER_FORMATS.us;

// Normalize a format-specific display string (e.g. EU "1.234,56") to a plain JS number.
export const parseValueToNumber = (val, numberFormat) => {
  if (val === undefined || val === null || val === '') return 0;

  const strVal = String(val);

  // Fast path: an already-canonical number (no group separators, dot decimal),
  if (/^-?\d+\.?\d*$/.test(strVal)) {
    return parseFloat(strVal) || 0;
  }

  const { groupSeparator, decimalSeparator } = getNumberFormatConfig(numberFormat);
  // Strip group separators, then normalise the decimal separator to '.'.
  let normalized = strVal.split(groupSeparator).join('');
  if (decimalSeparator !== '.') {
    normalized = normalized.split(decimalSeparator).join('.');
  }
  return parseFloat(normalized) || 0;
};

/**
 * How many decimal places the Decimal places setting actually asks for.
 *
 * `isSet` distinguishes an explicit `0` — a whole-number currency such as JPY — from a setting that
 * is cleared, non-numeric or negative, which falls back to two. `Number('') === 0`, so keying off
 * the number alone would read a cleared setting as "no decimals".
 *
 * Declared once because the FIELD and the VALUE both need it: the field passes it to the input
 * library, and every normalization below trims to it. Read separately they disagreed, and a cleared
 * setting truncated a Default value to whole numbers while typing still accepted decimals.
 */
export const resolveDecimalPlaces = (decimalPlaces) => {
  const parsed = Number(decimalPlaces);
  const isSet =
    decimalPlaces !== '' &&
    decimalPlaces !== null &&
    decimalPlaces !== undefined &&
    Number.isFinite(parsed) &&
    parsed >= 0;
  return { isSet, places: isSet ? parsed : 2 };
};

/**
 * Keep at most `digits` decimal places, by truncation rather than rounding — the behaviour the
 * `setValue` action has always had. Moved here from useInput.js so the rule below is the only
 * place a currency amount is normalized.
 *
 * Done on the number, not on its text. `toString()` renders anything at or above 1e21, or below
 * 1e-6, in exponential form — `2.89e+23` — and the dot in that mantissa is NOT a decimal
 * separator. Splitting on it read `8912833829332324e+23` as the decimals and kept two characters,
 * turning a 24-digit amount into `2.89`: a different, entirely plausible-looking number.
 */
const limitDecimalPlaces = (value, digits) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  const places = Math.max(0, Math.min(20, Number(digits) || 0));

  // `toString()` is exact for an ordinary amount — it gives the shortest text that round-trips, so
  // slicing it truncates without rounding and without float arithmetic. It is only unusable at the
  // two ends of the range, where it switches to exponential form and the mantissa dot is not a
  // decimal separator. Both ends are answered before the slice.

  // At 1e21 and above there is no fractional part left to trim.
  if (Math.abs(amount) >= 1e21) return amount;
  // Below the smallest amount `places` decimals can express, truncation is zero. This also covers
  // everything under 1e-6, the other end where `toString()` turns exponential.
  if (amount !== 0 && Math.abs(amount) < 10 ** -places) return 0;

  const text = String(amount);
  if (!text.includes('.')) return amount;
  const [whole, decimals] = text.split('.');
  return Number(places > 0 ? `${whole}.${decimals.slice(0, places)}` : whole);
};

/**
 * The ONE rule for turning an authored currency amount into the plain numeric string the field
 * stores: a Default value, a `setValue` argument, or anything else a builder can supply.
 *
 * Authored text may carry the format's group separators ("1,234.56", EU "1.234,56"); the library
 * that renders the field expects a plain number and will otherwise re-parse the text its own way
 * and correct itself, which is how a grouped Default value used to collapse to its first digit.
 * Returns '' for an empty input, the one value that is not an amount.
 */
export const toCanonicalAmount = (rawValue, numberFormat, decimalPlaces) => {
  if (rawValue === '' || rawValue === null || rawValue === undefined) return '';
  const amount = Number(limitDecimalPlaces(parseValueToNumber(rawValue, numberFormat), decimalPlaces));
  // Total by construction. `Infinity` and `NaN` reach here as genuine numbers — the registered
  // schema accepts them — and the field would render them as the literal text. They become 0,
  // which is what an unusable amount has always fallen back to.
  if (!Number.isFinite(amount)) return '0';
  // `String()` renders 1e21 and above in exponential form, and the field's library reads that as
  // digits plus a stray decimal, printing `…240,000,000.8912833829332324`. Above that threshold a
  // double is always a whole number, so it can be written out in full instead.
  return Math.abs(amount) >= 1e21 ? BigInt(Math.trunc(amount)).toString() : String(amount);
};

export const CurrencyMap = {
  AE: {
    currency: 'AED',
    prefix: 'د.إ.‏',
    country: 'United Arab Emirates',
  },
  AF: {
    currency: 'AFN',
    prefix: '؋',
    country: 'Afghanistan',
  },
  AL: {
    currency: 'ALL',
    prefix: 'Lek',
    country: 'Albania',
  },
  AM: {
    currency: 'AMD',
    prefix: 'դր.',
    country: 'Armenia',
  },
  AR: {
    currency: 'ARS',
    prefix: '$',
    country: 'Argentina',
  },
  AU: {
    currency: 'AUD',
    prefix: '$',
    country: 'Australia',
  },
  AZ: {
    currency: 'AZN',
    prefix: 'ман.',
    country: 'Azerbaijan',
  },
  BA: {
    currency: 'BAM',
    prefix: 'KM',
    country: 'Bosnia and Herzegovina',
  },
  BD: {
    currency: 'BDT',
    prefix: '৳',
    country: 'Bangladesh',
  },
  BG: {
    currency: 'BGN',
    prefix: 'лв.',
    country: 'Bulgaria',
  },
  BH: {
    currency: 'BHD',
    prefix: 'د.ب.‏',
    country: 'Bahrain',
  },
  BI: {
    currency: 'BIF',
    prefix: 'FBu',
    country: 'Burundi',
  },
  BN: {
    currency: 'BND',
    prefix: '$',
    country: 'Brunei Darussalam',
  },
  BO: {
    currency: 'BOB',
    prefix: 'Bs',
    country: 'Bolivia',
  },
  BR: {
    currency: 'BRL',
    prefix: 'R$',
    country: 'Brazil',
  },
  BV: {
    currency: 'NOK',
    prefix: 'kr',
    country: 'Bouvet Island',
  },
  BW: {
    currency: 'BWP',
    prefix: 'P',
    country: 'Botswana',
  },
  BY: {
    currency: 'BYR',
    prefix: 'BYR',
    country: 'Belarus',
  },
  BZ: {
    currency: 'BZD',
    prefix: '$',
    country: 'Belize',
  },
  CA: {
    currency: 'CAD',
    prefix: '$',
    country: 'Canada',
  },
  CD: {
    currency: 'CDF',
    prefix: 'FrCD',
    country: 'Congo, Democratic Republic of the',
  },
  CF: {
    currency: 'XAF',
    prefix: 'FCFA',
    country: 'Central African Republic',
  },
  CH: {
    currency: 'CHF',
    prefix: 'CHF',
    country: 'Switzerland',
  },
  CL: {
    currency: 'CLP',
    prefix: '$',
    country: 'Chile',
  },
  CN: {
    currency: 'CNY',
    prefix: 'CN¥',
    country: 'China',
  },
  CO: {
    currency: 'COP',
    prefix: '$',
    country: 'Colombia',
  },
  CR: {
    currency: 'CRC',
    prefix: '₡',
    country: 'Costa Rica',
  },
  CV: {
    currency: 'CVE',
    prefix: 'CV$',
    country: 'Cape Verde',
  },
  CZ: {
    currency: 'CZK',
    prefix: 'Kč',
    country: 'Czech Republic',
  },
  DJ: {
    currency: 'DJF',
    prefix: 'Fdj',
    country: 'Djibouti',
  },
  DK: {
    currency: 'DKK',
    prefix: 'kr',
    country: 'Denmark',
  },
  DO: {
    currency: 'DOP',
    prefix: 'RD$',
    country: 'Dominican Republic',
  },
  DZ: {
    currency: 'DZD',
    prefix: 'د.ج.‏',
    country: 'Algeria',
  },
  EG: {
    currency: 'EGP',
    prefix: 'ج.م.‏',
    country: 'Egypt',
  },
  ER: {
    currency: 'ERN',
    prefix: 'Nfk',
    country: 'Eritrea',
  },
  EU: {
    currency: 'EUR',
    prefix: '€',
    country: 'European Union',
  },
  ET: {
    currency: 'ETB',
    prefix: 'Br',
    country: 'Ethiopia',
  },
  GB: {
    currency: 'GBP',
    prefix: '£',
    country: 'United Kingdom',
  },
  GE: {
    currency: 'GEL',
    prefix: 'GEL',
    country: 'Georgia',
  },
  GH: {
    currency: 'GHS',
    prefix: 'GH₵',
    country: 'Ghana',
  },
  GN: {
    currency: 'GNF',
    prefix: 'FG',
    country: 'Guinea',
  },
  GT: {
    currency: 'GTQ',
    prefix: 'Q',
    country: 'Guatemala',
  },
  HK: {
    currency: 'HKD',
    prefix: '$',
    country: 'Hong Kong',
  },
  HN: {
    currency: 'HNL',
    prefix: 'L',
    country: 'Honduras',
  },
  HR: {
    currency: 'HRK',
    prefix: 'kn',
    country: 'Croatia',
  },
  HU: {
    currency: 'HUF',
    prefix: 'Ft',
    country: 'Hungary',
  },
  ID: {
    currency: 'IDR',
    prefix: 'Rp',
    country: 'Indonesia',
  },
  IL: {
    currency: 'ILS',
    prefix: '₪',
    country: 'Israel',
  },
  IN: {
    currency: 'INR',
    prefix: '₹',
    country: 'India',
  },
  IQ: {
    currency: 'IQD',
    prefix: 'د.ع.‏',
    country: 'Iraq',
  },
  IR: {
    currency: 'IRR',
    prefix: '﷼',
    country: 'Iran, Islamic Republic of',
  },
  IS: {
    currency: 'ISK',
    prefix: 'kr',
    country: 'Iceland',
  },
  JM: {
    currency: 'JMD',
    prefix: '$',
    country: 'Jamaica',
  },
  JO: {
    currency: 'JOD',
    prefix: 'د.أ.‏',
    country: 'Jordan',
  },
  JP: {
    currency: 'JPY',
    prefix: '￥',
    country: 'Japan',
  },
  KE: {
    currency: 'KES',
    prefix: 'Ksh',
    country: 'Kenya',
  },
  KH: {
    currency: 'KHR',
    prefix: '៛',
    country: 'Cambodia',
  },
  KM: {
    currency: 'KMF',
    prefix: 'FC',
    country: 'Comoros',
  },
  KR: {
    currency: 'KRW',
    prefix: '₩',
    country: 'Korea, Republic of',
  },
  KW: {
    currency: 'KWD',
    prefix: 'د.ك.‏',
    country: 'Kuwait',
  },
  KZ: {
    currency: 'KZT',
    prefix: 'тңг.',
    country: 'Kazakhstan',
  },
  LB: {
    currency: 'LBP',
    prefix: 'ل.ل.‏',
    country: 'Lebanon',
  },
  LK: {
    currency: 'LKR',
    prefix: 'SL Re',
    country: 'Sri Lanka',
  },
  LT: {
    currency: 'LTL',
    prefix: 'Lt',
    country: 'Lithuania',
  },
  LY: {
    currency: 'LYD',
    prefix: 'د.ل.‏',
    country: 'Libya',
  },
  MA: {
    currency: 'MAD',
    prefix: 'د.م.‏',
    country: 'Morocco',
  },
  MD: {
    currency: 'MDL',
    prefix: 'MDL',
    country: 'Moldova, Republic of',
  },
  MG: {
    currency: 'MGA',
    prefix: 'MGA',
    country: 'Madagascar',
  },
  MK: {
    currency: 'MKD',
    prefix: 'MKD',
    country: 'Macedonia, the Former Yugoslav Republic of',
  },
  MM: {
    currency: 'MMK',
    prefix: 'K',
    country: 'Myanmar',
  },
  MO: {
    currency: 'MOP',
    prefix: 'MOP$',
    country: 'Macao',
  },
  MU: {
    currency: 'MUR',
    prefix: 'MURs',
    country: 'Mauritius',
  },
  MX: {
    currency: 'MXN',
    prefix: '$',
    country: 'Mexico',
  },
  MY: {
    currency: 'MYR',
    prefix: 'RM',
    country: 'Malaysia',
  },
  MZ: {
    currency: 'MZN',
    prefix: 'MTn',
    country: 'Mozambique',
  },
  NA: {
    currency: 'NAD',
    prefix: 'N$',
    country: 'Namibia',
  },
  NG: {
    currency: 'NGN',
    prefix: '₦',
    country: 'Nigeria',
  },
  NI: {
    currency: 'NIO',
    prefix: 'C$',
    country: 'Nicaragua',
  },
  NO: {
    currency: 'NOK',
    prefix: 'kr',
    country: 'Norway',
  },
  NP: {
    currency: 'NPR',
    prefix: 'नेरू',
    country: 'Nepal',
  },
  NZ: {
    currency: 'NZD',
    prefix: '$',
    country: 'New Zealand',
  },
  OM: {
    currency: 'OMR',
    prefix: 'ر.ع.‏',
    country: 'Oman',
  },
  PA: {
    currency: 'PAB',
    prefix: 'B/.',
    country: 'Panama',
  },
  PE: {
    currency: 'PEN',
    prefix: 'S/.',
    country: 'Peru',
  },
  PH: {
    currency: 'PHP',
    prefix: '₱',
    country: 'Philippines',
  },
  PK: {
    currency: 'PKR',
    prefix: '₨',
    country: 'Pakistan',
  },
  PL: {
    currency: 'PLN',
    prefix: 'zł',
    country: 'Poland',
  },
  PY: {
    currency: 'PYG',
    prefix: '₲',
    country: 'Paraguay',
  },
  QA: {
    currency: 'QAR',
    prefix: 'ر.ق.‏',
    country: 'Qatar',
  },
  RO: {
    currency: 'RON',
    prefix: 'RON',
    country: 'Romania',
  },
  RS: {
    currency: 'RSD',
    prefix: 'дин.',
    country: 'Serbia',
  },
  RU: {
    currency: 'RUB',
    prefix: '₽',
    country: 'Russian Federation',
  },
  RW: {
    currency: 'RWF',
    prefix: 'FR',
    country: 'Rwanda',
  },
  SA: {
    currency: 'SAR',
    prefix: 'ر.س.‏',
    country: 'Saudi Arabia',
  },
  SD: {
    currency: 'SDG',
    prefix: 'SDG',
    country: 'Sudan',
  },
  SE: {
    currency: 'SEK',
    prefix: 'kr',
    country: 'Sweden',
  },
  SG: {
    currency: 'SGD',
    prefix: '$',
    country: 'Singapore',
  },
  SJ: {
    currency: 'NOK',
    prefix: 'kr',
    country: 'Svalbard and Jan Mayen',
  },
  SN: {
    currency: 'XOF',
    prefix: 'CFA',
    country: 'Senegal',
  },
  SO: {
    currency: 'SOS',
    prefix: 'Ssh',
    country: 'Somalia',
  },
  SY: {
    currency: 'SYP',
    prefix: 'ل.س.‏',
    country: 'Syrian Arab Republic',
  },
  TH: {
    currency: 'THB',
    prefix: '฿',
    country: 'Thailand',
  },
  TN: {
    currency: 'TND',
    prefix: 'د.ت.‏',
    country: 'Tunisia',
  },
  TO: {
    currency: 'TOP',
    prefix: 'T$',
    country: 'Tonga',
  },
  TR: {
    currency: 'TRY',
    prefix: 'TL',
    country: 'Turkey',
  },
  TT: {
    currency: 'TTD',
    prefix: '$',
    country: 'Trinidad and Tobago',
  },
  TW: {
    currency: 'TWD',
    prefix: 'NT$',
    country: 'Taiwan, Province of China',
  },
  TZ: {
    currency: 'TZS',
    prefix: 'TSh',
    country: 'United Republic of Tanzania',
  },
  UA: {
    currency: 'UAH',
    prefix: '₴',
    country: 'Ukraine',
  },
  UG: {
    currency: 'UGX',
    prefix: 'USh',
    country: 'Uganda',
  },
  US: {
    currency: 'USD',
    prefix: '$',
    country: 'United States',
  },
  UY: {
    currency: 'UYU',
    prefix: '$',
    country: 'Uruguay',
  },
  UZ: {
    currency: 'UZS',
    prefix: 'UZS',
    country: 'Uzbekistan',
  },
  VE: {
    currency: 'VEF',
    prefix: 'Bs.F.',
    country: 'Venezuela',
  },
  VN: {
    currency: 'VND',
    prefix: '₫',
    country: 'Vietnam',
  },
  VU: {
    currency: 'VUV',
    prefix: 'VT',
    country: 'Vanuatu',
  },
  YE: {
    currency: 'YER',
    prefix: 'ر.ي.‏',
    country: 'Yemen',
  },
  ZA: {
    currency: 'ZAR',
    prefix: 'R',
    country: 'South Africa',
  },
  ZM: {
    currency: 'ZMK',
    prefix: 'ZK',
    country: 'Zambia',
  },
};
