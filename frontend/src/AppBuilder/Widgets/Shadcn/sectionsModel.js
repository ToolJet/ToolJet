// shadcn/ui pack: the pure logic of the page sections (ShadSections.jsx): the hero's facts, the card grid's cards and
// columns, the record list's rows and the summary strip's figures. Every function takes whatever the author bound and
// never throws.
import { FORMATS, formatter, num } from './chartsModel';
import { chipTone } from '../NewTable/_utils/chipTone';

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isImageUrl = (v) => isText(v) && /^(https?:\/\/|data:image\/|\/|\.\/)/i.test(v.trim());
const shown = (v) => (v === null || v === undefined ? '' : typeof v === 'object' ? '' : String(v));

/** The hero's facts beside the title: ['Sun, 11 Oct', '14 bookings'], [{ label, value }] or one string with ' · '
 *  between facts. Empty entries are dropped. */
export const heroMeta = (meta) => {
  const list = Array.isArray(meta) ? meta : isText(meta) ? meta.split(/\s+·\s+/) : [];
  return list.flatMap((entry) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const value = shown(entry.value);
      return value ? [{ ...(isText(entry.label) ? { label: entry.label } : {}), value }] : [];
    }
    const value = shown(entry).trim();
    return value ? [{ value }] : [];
  });
};

/** The hero's aside, on the right of its text: a headline figure ({ kind: 'figure', value, label }) from a number or
 *  text, or up to four facts ({ kind: 'facts', facts: [{ label, value }], label }) from a list (['Open 14'] or
 *  [{ label, value }]). label is the figure's caption, or the facts' heading. null when there is nothing to show. */
export const heroAside = (value, label) => {
  const heading = shown(label).trim();
  if (Array.isArray(value)) {
    const facts = heroMeta(value).slice(0, 4);
    return facts.length ? { kind: 'facts', facts, label: heading } : null;
  }
  const figure = typeof value === 'number' ? formatValue(value, 'auto') : shown(value).trim();
  return figure ? { kind: 'figure', value: figure, label: heading } : null;
};

// A label that only repeats its field key as written ('status:status') is not a label: "status To do" read like debug
// output. A label in its own case ('serves:Serves') is meant and stays.
const sameName = (label, field) => String(label).trim() === String(field).trim();

/** One meta field: 'prep' shows the value, 'prep:{} min' places it in the label, 'serves:Serves' puts the label first. */
const metaPart = (row, spec) => {
  const [field, label] = spec.split(/:(.*)/s).map((s) => (s ?? '').trim());
  const value = shown(row[field]);
  if (!field || !value) return '';
  if (!label || sameName(label, field)) return value;
  return label.includes('{}') ? label.replace('{}', value) : `${label} ${value}`;
};

const firstTextField = (row) => Object.keys(row).find((k) => isText(row[k]));

/** Keys from ids, one of their own for every item: a repeated id (or a row without one, keyed by its position, where
 *  another row's id is that number) gets a suffix, so React keeps the rows apart and a click selects one row, not
 *  every row that shares the key. Rows with an id claim it first; the first of a repeated id keeps it. */
const uniqueKeys = (items, fromId) => {
  const seen = new Set();
  const keys = items.map(() => null);
  const claim = (i) => {
    const base = items[i].key;
    let key = base;
    for (let n = 0; seen.has(key); n++) key = `${base}~${i}${n ? `~${n}` : ''}`;
    seen.add(key);
    keys[i] = key;
  };
  items.forEach((_, i) => fromId[i] && claim(i));
  items.forEach((_, i) => !fromId[i] && claim(i));
  return items.map((item, i) => (keys[i] === item.key ? item : { ...item, key: keys[i] }));
};

/** Field names from a comma list ('cuisine, diet') or a list of names; anything else is none. */
export const fieldList = (spec) =>
  (Array.isArray(spec) ? spec : isText(spec) ? spec.split(',') : [])
    .filter((s) => typeof s === 'string')
    .map((s) => s.trim())
    .filter(Boolean);

/** A percentage from a number (42.5) or text ('42.5', '42.5%'); null when it is not one. Not clamped: a bar clamps
 *  its width, a label shows what was given (120%). */
export const percentOf = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
  return m ? Number(m[1]) : null;
};

/** A bar's width for a percentage: 0 to 100. */
export const barWidth = (pct) => (Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0);

/** A percentage as a label: whole numbers as written, others to one decimal (12.5%, 33.3%). */
export const percentLabel = (pct) =>
  Number.isFinite(pct) ? `${Math.abs(pct - Math.round(pct)) < 0.05 ? Math.round(pct) : pct.toFixed(1)}%` : '';

/** An avatar from a field's value: an image when it holds a URL, else the initials of its text (else of `fallback`). */
const avatarOf = (value, fallback) => {
  const image = isImageUrl(value) ? value.trim() : '';
  return {
    image,
    name: !image && shown(value).trim() ? shown(value).trim() : fallback,
  };
};

/** Cards from rows: title, subtitle, image, description, badges, an eyebrow, an avatar, a progress and a meta line,
 *  each read from the named field (metaFields is a comma list joined with ' · '; badgeField and badgeFields give the
 *  badges, at most 4). The title falls back to the first text field. Rows that are not objects are skipped. */
export const cardItems = (data, fields = {}) => {
  if (!Array.isArray(data)) return [];
  const f = fields || {};
  const metaSpecs = isText(f.metaFields)
    ? f.metaFields
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const badgeKeys = [...new Set([...(isText(f.badgeField) ? [f.badgeField.trim()] : []), ...fieldList(f.badgeFields)])];
  const items = data.flatMap((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const titleKey = isText(f.titleField) && f.titleField in row ? f.titleField : firstTextField(row);
    const id = isText(f.idField) ? row[f.idField] : row.id;
    const title = titleKey ? shown(row[titleKey]) : '';
    const badges = badgeKeys
      .map((k) => shown(row[k]).trim())
      .filter(Boolean)
      .slice(0, 4);
    const hasAvatar = isText(f.avatarField) && f.avatarField in row;
    const progress = isText(f.progressField) ? percentOf(row[f.progressField]) : null;
    // A description that only repeats the bar's percentage ("25%") is left out: the bar labels it already.
    const description = isText(f.descriptionField) ? shown(row[f.descriptionField]) : '';
    const repeatsProgress = progress !== null && description.replace(/\s+/g, '') === `${Math.round(progress)}%`;
    return [
      {
        key: shown(id) || String(index),
        keyFromId: !!shown(id),
        title,
        // A subtitle that only repeats the badge (a category shown as both) is left out.
        subtitle:
          isText(f.subtitleField) && shown(row[f.subtitleField]).trim() !== (badges[0] || '').trim()
            ? shown(row[f.subtitleField])
            : '',
        image: isText(f.imageField) ? shown(row[f.imageField]) : '',
        description: repeatsProgress ? '' : description,
        badge: badges[0] || '',
        badges,
        eyebrow: isText(f.eyebrowField) ? shown(row[f.eyebrowField]).trim() : '',
        avatar: hasAvatar ? avatarOf(row[f.avatarField], title) : null,
        progress,
        meta: metaSpecs
          .map((spec) => metaPart(row, spec))
          .filter(Boolean)
          .join(' · '),
        row,
      },
    ];
  });
  return uniqueKeys(
    items.map(({ keyFromId, ...item }) => item),
    items.map((item) => item.keyFromId)
  );
};

/** Columns for a grid this wide: the set count, but never more than fit at the minimum card width; 'auto' (or 0)
 *  fits as many as the width allows. At least one. */
export const gridColumns = (columns, width, minCardWidth = 240) => {
  const min = Math.max(120, Number(minCardWidth) || 240);
  const fit = Math.max(1, Math.floor((Number(width) || 0) / min));
  const set = Math.floor(Number(columns));
  return Number.isFinite(set) && set > 0 ? Math.max(1, Math.min(set, fit)) : fit;
};

// ---- Value formats (record list, summary strip) ----------------------------------------------------------------------

export const VALUE_FORMATS = ['auto', ...FORMATS, 'date', 'datetime'];

/** A date from a Date, a timestamp or date text. A bare 'YYYY-MM-DD' is that day where the viewer is (Date reads it as
 *  UTC midnight, which shows the day before west of Greenwich). null when it is not a date. */
export const toDay = (v) => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') return Number.isFinite(v) ? new Date(v) : null;
  if (!isText(v)) return null;
  const day = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(v.trim());
  return Number.isNaN(d.getTime()) ? null : d;
};

const dateText = (d, withTime) => {
  const sameYear = d.getFullYear() === new Date().getFullYear();
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' }),
      ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    }).format(d);
  } catch {
    return d.toDateString();
  }
};

/** A value in a format: 'number', 'currency' (in currency, default USD), 'percent' (42.5 shows 42.5%) and 'compact'
 *  format numbers and numeric text; 'date' (14 Oct) and 'datetime' (14 Oct, 9:30 AM) format dates. 'auto' groups the
 *  digits of a bare number. Anything that is not of the format's kind (an already formatted "$1,250.00", "12 open")
 *  shows as written; objects show nothing. */
export const formatValue = (value, format = 'auto', currency) => {
  // A number that is not finite (Infinity, NaN, a division by zero in a binding) is not a value to show.
  if (value === null || value === undefined || typeof value === 'object') return '';
  if (typeof value === 'number' && !Number.isFinite(value)) return '';
  if (format === 'date' || format === 'datetime') {
    const d = toDay(value);
    return d ? dateText(d, format === 'datetime') : String(value);
  }
  const numeric =
    typeof value === 'number'
      ? Number.isFinite(value)
      : typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim());
  if (!numeric) return String(value);
  if (!FORMATS.includes(format)) return typeof value === 'number' ? formatter({ format: 'number' })(value) : value;
  const n = Number(value);
  // Money with cents shows both digits ($386.50, not $386.5); whole amounts show none.
  if (format === 'currency' && !Number.isInteger(n)) {
    const code = isText(currency) && /^[A-Za-z]{3}$/.test(currency.trim()) ? currency.trim().toUpperCase() : 'USD';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 2,
      }).format(n);
    } catch {
      return formatter({ format, currency })(n);
    }
  }
  return formatter({ format, currency })(n);
};

// ---- Record list -----------------------------------------------------------------------------------------------------

/** One record meta field: 'city' shows the value, 'total|currency' formats it ('|date', '|number', ...), 'due|date:Due {}'
 *  places it in a label and 'seats:Seats' puts the label first. */
export const recordMetaPart = (row, spec, currency) => {
  const [head, label] = spec.split(/:(.*)/s).map((s) => (s ?? '').trim());
  const [field, format] = head.split('|').map((s) => s.trim());
  if (!field || !(field in row)) return '';
  const value = formatValue(row[field], VALUE_FORMATS.includes(format) ? format : 'auto', currency);
  if (!value) return '';
  if (!label || sameName(label, field)) return value;
  return label.includes('{}') ? label.replace('{}', value) : `${label} ${value}`;
};

/** Rows of a record list: a title, an avatar (an image when avatarField holds a URL, else the initials of avatarField's
 *  text or of the title), a meta line (metaFields, a comma list of field specs joined with ' · '), a status and a
 *  trailing value in valueFormat. The title falls back to the first text field. Rows that are not objects are
 *  skipped. */
export const recordItems = (data, fields = {}) => {
  if (!Array.isArray(data)) return [];
  const f = fields || {};
  const metaSpecs = isText(f.metaFields)
    ? f.metaFields
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const format = VALUE_FORMATS.includes(f.valueFormat) ? f.valueFormat : 'auto';
  const items = data.flatMap((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const titleKey = isText(f.titleField) && f.titleField in row ? f.titleField : firstTextField(row);
    const title = titleKey ? shown(row[titleKey]) : '';
    const id = isText(f.idField) ? row[f.idField] : row.id;
    const avatarValue = isText(f.avatarField) ? row[f.avatarField] : undefined;
    const image = isImageUrl(avatarValue) ? avatarValue.trim() : '';
    const avatarName = !image && shown(avatarValue).trim() ? shown(avatarValue).trim() : title;
    return [
      {
        key: shown(id) || String(index),
        keyFromId: !!shown(id),
        title,
        image,
        avatarName,
        meta: metaSpecs
          .map((spec) => recordMetaPart(row, spec, f.currency))
          .filter(Boolean)
          .join(' · '),
        status: isText(f.statusField) ? shown(row[f.statusField]) : '',
        value: isText(f.valueField) ? formatValue(row[f.valueField], format, f.currency) : '',
        progress: isText(f.progressField) ? percentOf(row[f.progressField]) : null,
        row,
        index,
      },
    ];
  });
  return uniqueKeys(
    items.map(({ keyFromId, ...item }) => item),
    items.map((item) => item.keyFromId)
  );
};

// ---- Summary strip ---------------------------------------------------------------------------------------------------

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

// ---- Progress list ---------------------------------------------------------------------------------------------------

export const PROGRESS_TONES = ['success', 'warning', 'danger', 'info', 'neutral'];
const TONE_NAMES = {
  positive: 'success',
  good: 'success',
  negative: 'danger',
  bad: 'danger',
  error: 'danger',
};
// Words a goal or a budget is described with that a status chip does not know.
const PROGRESS_WORDS = [
  ['danger', /\b(over|over budget|over limit|overspent|exceeded|behind|off track)\b/],
  ['success', /\b(ahead|achieved|met|hit|reached|under budget)\b/],
];

/** A row's tone from its status: a tone name ('success', 'warning', 'danger', 'info', 'neutral'), else the status's
 *  words ('On track' success, 'At risk' warning, 'Over budget' or 'Behind' danger). '' when it has none. */
export const progressTone = (status) => {
  if (typeof status !== 'string' || !status.trim()) return '';
  const text = status.trim().toLowerCase();
  if (PROGRESS_TONES.includes(text)) return text;
  if (TONE_NAMES[text]) return TONE_NAMES[text];
  const word = PROGRESS_WORDS.find(([, re]) => re.test(text.replace(/[_-]+/g, ' ')));
  if (word && !/^not\b/.test(text)) return word[0];
  const tone = chipTone(status);
  return tone === 'neutral' ? '' : tone;
};

/** The tone a percentage gives under autoTone: 'goal' turns green at 100%; 'limit' (a budget, a quota) amber from
 *  80% and red over 100%. '' otherwise. */
export const autoProgressTone = (pct, mode) => {
  if (!Number.isFinite(pct)) return '';
  if (mode === 'goal') return pct >= 100 ? 'success' : '';
  if (mode === 'limit') return pct > 100 ? 'danger' : pct >= 80 ? 'warning' : '';
  return '';
};

const PROGRESS_FORMATS = ['auto', ...FORMATS];

/** Rows of a progress list: { key, label, value, target, pct, caption, status, tone, row, index }. pct is percentField
 *  when it holds a number, else value / target; a row with a value and no target reads its value as the percentage.
 *  value and target show in valueFormat. The status gives the tone (a status that only names a tone shows no chip),
 *  else autoTone does. Rows that are not objects are skipped. */
export const progressItems = (data, fields = {}) => {
  if (!Array.isArray(data)) return [];
  const f = fields || {};
  const format = PROGRESS_FORMATS.includes(f.valueFormat) ? f.valueFormat : 'auto';
  const numberOf = (v) => (typeof v === 'number' ? (Number.isFinite(v) ? v : null) : percentOf(v));
  const items = data.flatMap((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const labelKey = isText(f.labelField) && f.labelField in row ? f.labelField : firstTextField(row);
    const id = isText(f.idField) ? row[f.idField] : row.id;
    const rawValue = isText(f.valueField) ? row[f.valueField] : undefined;
    const rawTarget = isText(f.targetField) ? row[f.targetField] : undefined;
    const value = numberOf(rawValue);
    const target = numberOf(rawTarget);
    let pct = isText(f.percentField) ? numberOf(row[f.percentField]) : null;
    if (pct === null && value !== null) pct = target !== null ? (target > 0 ? (value / target) * 100 : null) : value;
    const status = isText(f.statusField) ? shown(row[f.statusField]).trim() : '';
    const tone = progressTone(status) || autoProgressTone(pct, f.autoTone);
    return [
      {
        key: shown(id) || String(index),
        keyFromId: !!shown(id),
        label: labelKey ? shown(row[labelKey]) : '',
        value: value !== null ? formatValue(value, format, f.currency) : '',
        target: target !== null ? formatValue(target, format, f.currency) : '',
        pct,
        caption: isText(f.captionField) ? shown(row[f.captionField]).trim() : '',
        // A status that only names a tone colours the bar without a chip.
        status: status && !PROGRESS_TONES.includes(status.toLowerCase()) ? status : '',
        tone,
        row,
        index,
      },
    ];
  });
  return uniqueKeys(
    items.map(({ keyFromId, ...item }) => item),
    items.map((item) => item.keyFromId)
  );
};
