// ToolJet UI 2.0: the pure logic of the page sections (Hero, CardGrid, RecordList): the hero's facts, the card grid's cards and
// columns, the record list's rows and the value formats (the summary strip's figures are in summaryModel.ts, the
// progress list's rows in progressModel.ts). Every function takes whatever the author bound and never throws.
import { formatValue, VALUE_FORMATS } from '@/AppBuilder/Widgets/Ui2/_shared/format';
import { isNonBlankString, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** A data row as bound: any fields, of any value. */
export type Row = Record<string, unknown>;

const isImageUrl = (v: unknown): v is string =>
  isNonBlankString(v) && /^(https?:\/\/|data:image\/|\/|\.\/)/i.test(v.trim());

/** The hero's facts beside the title: ['Sun, 11 Oct', '14 bookings'], [{ label, value }] or one string with ' · '
 *  between facts. Empty entries are dropped. */
export interface HeroFact {
  label?: string;
  value: string;
}

export const heroMeta = (meta: unknown): HeroFact[] => {
  const list: unknown[] = Array.isArray(meta) ? meta : isNonBlankString(meta) ? meta.split(/\s+·\s+/) : [];
  return list.flatMap((entry): HeroFact[] => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const { label, value: raw } = entry as Row;
      const value = toText(raw);
      return value ? [{ ...(isNonBlankString(label) ? { label } : {}), value }] : [];
    }
    const value = toText(entry).trim();
    return value ? [{ value }] : [];
  });
};

/** The hero's aside, on the right of its text: a headline figure ({ kind: 'figure', value, label }) from a number or
 *  text, or up to four facts ({ kind: 'facts', facts: [{ label, value }], label }) from a list (['Open 14'] or
 *  [{ label, value }]). label is the figure's caption, or the facts' heading. null when there is nothing to show. */
export type HeroAside =
  | { kind: 'figure'; value: string; label: string }
  | { kind: 'facts'; facts: HeroFact[]; label: string };

export const heroAside = (value: unknown, label: unknown): HeroAside | null => {
  const heading = toText(label).trim();
  if (Array.isArray(value)) {
    const facts = heroMeta(value).slice(0, 4);
    return facts.length ? { kind: 'facts', facts, label: heading } : null;
  }
  const figure = typeof value === 'number' ? formatValue(value, 'auto') : toText(value).trim();
  return figure ? { kind: 'figure', value: figure, label: heading } : null;
};

// A label that only repeats its field key as written ('status:status') is not a label: "status To do" read like debug
// output. A label in its own case ('serves:Serves') is meant and stays.
const sameName = (label: string, field: string): boolean => String(label).trim() === String(field).trim();
/** A value in its label: at '{}', else after the label; a label that only names the field is left out. */
const withLabel = (label: string, field: string, value: string): string =>
  !label || sameName(label, field) ? value : label.includes('{}') ? label.replace('{}', value) : `${label} ${value}`;

/** One meta field: 'prep' shows the value, 'prep:{} min' places it in the label, 'serves:Serves' puts the label first. */
const metaPart = (row: Row, spec: string): string => {
  const [field, label] = spec.split(/:(.*)/s).map((s) => (s ?? '').trim());
  const value = toText(row[field]);
  return field && value ? withLabel(label, field, value) : '';
};

export const firstTextField = (row: Row): string | undefined => Object.keys(row).find((k) => isNonBlankString(row[k]));

/** Keys from ids, one of their own for every item: a repeated id (or a row without one, keyed by its position, where
 *  another row's id is that number) gets a suffix, so React keeps the rows apart and a click selects one row, not
 *  every row that shares the key. Rows with an id claim it first; the first of a repeated id keeps it. The suffix is
 *  the row's position; with `byOccurrence` (the selectable lists) it is the id's occurrence (the second "1" is "1~2"),
 *  so a selected duplicate keeps its key when the data refreshes with other rows added in front of it. Steps and Chat
 *  keep the position: a step's filled-in id is exposed. */
export const uniqueKeys = <T extends { key: string }>(
  items: T[],
  fromId: boolean[],
  { byOccurrence = false }: { byOccurrence?: boolean } = {}
): T[] => {
  const seen = new Set<string>();
  const occurrences = new Map<string, number>();
  const keys: (string | null)[] = items.map(() => null);
  const claim = (i: number) => {
    const base = items[i].key;
    let key = base;
    if (byOccurrence) {
      let n = occurrences.get(base) ?? 1;
      while (seen.has(key)) key = `${base}~${++n}`;
      occurrences.set(base, n);
    } else {
      for (let n = 0; seen.has(key); n++) key = `${base}~${i}${n ? `~${n}` : ''}`;
    }
    seen.add(key);
    keys[i] = key;
  };
  items.forEach((_, i) => fromId[i] && claim(i));
  items.forEach((_, i) => !fromId[i] && claim(i));
  return items.map((item, i) => {
    const key = keys[i] ?? item.key;
    return key === item.key ? item : { ...item, key };
  });
};

/** Field names from a comma list ('cuisine, diet') or a list of names; anything else is none. */
export const fieldList = (spec: unknown): string[] =>
  (Array.isArray(spec) ? (spec as unknown[]) : isNonBlankString(spec) ? spec.split(',') : [])
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    .filter(Boolean);

/** A percentage from a number (42.5) or text ('42.5', '42.5%'); null when it is not one. Not clamped: a bar clamps
 *  its width, a label shows what was given (120%). */
export const percentOf = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
  return m ? Number(m[1]) : null;
};

/** A bar's width for a percentage: 0 to 100. */
export const barWidth = (pct: unknown): number =>
  typeof pct === 'number' && Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;

/** A percentage as a label: whole numbers as written, others to one decimal (12.5%, 33.3%). */
export const percentLabel = (pct: unknown): string =>
  typeof pct === 'number' && Number.isFinite(pct)
    ? `${Math.abs(pct - Math.round(pct)) < 0.05 ? Math.round(pct) : pct.toFixed(1)}%`
    : '';

/** An avatar from a field's value: an image when it holds a URL, else the initials of its text (else of `fallback`). */
const avatarOf = (value: unknown, fallback: string): { image: string; name: string } => {
  const image = isImageUrl(value) ? value.trim() : '';
  return {
    image,
    name: !image && toText(value).trim() ? toText(value).trim() : fallback,
  };
};

/** Cards from rows: title, subtitle, image, description, badges, an eyebrow, an avatar, a progress and a meta line,
 *  each read from the named field (metaFields is a comma list joined with ' · '; badgeField and badgeFields give the
 *  badges, at most 4). The title falls back to the first text field. Rows that are not objects are skipped. */
/** The card grid's field properties, as bound (field names, or comma lists of them; anything else reads as unset). */
export interface CardFields {
  titleField?: unknown;
  subtitleField?: unknown;
  imageField?: unknown;
  descriptionField?: unknown;
  badgeField?: unknown;
  badgeFields?: unknown;
  eyebrowField?: unknown;
  avatarField?: unknown;
  progressField?: unknown;
  metaFields?: unknown;
  idField?: unknown;
}

export interface CardItem {
  key: string;
  title: string;
  subtitle: string;
  image: string;
  description: string;
  badge: string;
  badges: string[];
  eyebrow: string;
  avatar: { image: string; name: string } | null;
  progress: number | null;
  meta: string;
  row: Row;
  index: number;
}

export const cardItems = (data: unknown, fields: CardFields = {}): CardItem[] => {
  if (!Array.isArray(data)) return [];
  const f = fields || {};
  // A comma list or a list of names (metaFields={["duration_label", "seats_label"]} showed nothing).
  const metaSpecs = fieldList(f.metaFields);
  const badgeKeys = [
    ...new Set([...(isNonBlankString(f.badgeField) ? [f.badgeField.trim()] : []), ...fieldList(f.badgeFields)]),
  ];
  const items = data.flatMap((row: Row, index: number): (CardItem & { keyFromId: boolean })[] => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const titleKey = isNonBlankString(f.titleField) && f.titleField in row ? f.titleField : firstTextField(row);
    const id = isNonBlankString(f.idField) ? row[f.idField] : row.id;
    const title = titleKey ? toText(row[titleKey]) : '';
    const badges = badgeKeys
      .map((k) => toText(row[k]).trim())
      .filter(Boolean)
      .slice(0, 4);
    const hasAvatar = isNonBlankString(f.avatarField) && f.avatarField in row;
    const progress = isNonBlankString(f.progressField) ? percentOf(row[f.progressField]) : null;
    // A description that only repeats the bar's percentage ("25%") is left out: the bar labels it already.
    const description = isNonBlankString(f.descriptionField) ? toText(row[f.descriptionField]) : '';
    const repeatsProgress = progress !== null && description.replace(/\s+/g, '') === `${Math.round(progress)}%`;
    return [
      {
        key: toText(id) || String(index),
        keyFromId: !!toText(id),
        title,
        // A subtitle that only repeats the badge (a category shown as both) is left out.
        subtitle:
          isNonBlankString(f.subtitleField) && toText(row[f.subtitleField]).trim() !== (badges[0] || '').trim()
            ? toText(row[f.subtitleField])
            : '',
        image: isNonBlankString(f.imageField) ? toText(row[f.imageField]) : '',
        description: repeatsProgress ? '' : description,
        badge: badges[0] || '',
        badges,
        eyebrow: isNonBlankString(f.eyebrowField) ? toText(row[f.eyebrowField]).trim() : '',
        avatar: hasAvatar && isNonBlankString(f.avatarField) ? avatarOf(row[f.avatarField], title) : null,
        progress,
        meta: metaSpecs
          .map((spec) => metaPart(row, spec))
          .filter(Boolean)
          .join(' · '),
        row,
        index,
      },
    ];
  });
  return uniqueKeys(
    items.map(({ keyFromId, ...item }) => item),
    items.map((item) => item.keyFromId),
    { byOccurrence: true }
  );
};

/** Columns for a grid this wide: the set count, but never more than fit at the minimum card width; 'auto' (or 0)
 *  fits as many as the width allows. At least one. */
export const gridColumns = (columns: unknown, width: unknown, minCardWidth: unknown = 240): number => {
  const min = Math.max(120, Number(minCardWidth) || 240);
  const fit = Math.max(1, Math.floor((Number(width) || 0) / min));
  const set = Math.floor(Number(columns));
  return Number.isFinite(set) && set > 0 ? Math.max(1, Math.min(set, fit)) : fit;
};

// ---- Record list -----------------------------------------------------------------------------------------------------

/** One record meta field: 'city' shows the value, 'total|currency' formats it ('|date', '|number', ...), 'due|date:Due {}'
 *  places it in a label and 'seats:Seats' puts the label first. */
export const recordMetaPart = (row: Row, spec: string, currency?: unknown): string => {
  const [head, label] = spec.split(/:(.*)/s).map((s) => (s ?? '').trim());
  const [field, format] = head.split('|').map((s) => s.trim());
  if (!field || !(field in row)) return '';
  const value = formatValue(row[field], VALUE_FORMATS.includes(format) ? format : 'auto', currency);
  return value ? withLabel(label, field, value) : '';
};

/** Rows of a record list: a title, an avatar (an image when avatarField holds a URL, else the initials of avatarField's
 *  text or of the title), a meta line (metaFields, a comma list of field specs joined with ' · '), a status and a
 *  trailing value in valueFormat. The title falls back to the first text field. Rows that are not objects are
 *  skipped. */
/** The record list's field properties, as bound. */
export interface RecordFields {
  titleField?: unknown;
  avatarField?: unknown;
  metaFields?: unknown;
  statusField?: unknown;
  valueField?: unknown;
  valueFormat?: unknown;
  progressField?: unknown;
  idField?: unknown;
  currency?: unknown;
}

export interface RecordItem {
  key: string;
  title: string;
  image: string;
  avatarName: string;
  meta: string;
  status: string;
  value: string;
  progress: number | null;
  row: Row;
  index: number;
}

export const recordItems = (data: unknown, fields: RecordFields = {}): RecordItem[] => {
  if (!Array.isArray(data)) return [];
  const f = fields || {};
  // A comma list or a list of names (metaFields={["duration_label", "seats_label"]} showed nothing).
  const metaSpecs = fieldList(f.metaFields);
  const format = typeof f.valueFormat === 'string' && VALUE_FORMATS.includes(f.valueFormat) ? f.valueFormat : 'auto';
  const items = data.flatMap((row: Row, index: number): (RecordItem & { keyFromId: boolean })[] => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const titleKey = isNonBlankString(f.titleField) && f.titleField in row ? f.titleField : firstTextField(row);
    const title = titleKey ? toText(row[titleKey]) : '';
    const id = isNonBlankString(f.idField) ? row[f.idField] : row.id;
    const avatarValue = isNonBlankString(f.avatarField) ? row[f.avatarField] : undefined;
    const image = isImageUrl(avatarValue) ? avatarValue.trim() : '';
    const avatarName = !image && toText(avatarValue).trim() ? toText(avatarValue).trim() : title;
    return [
      {
        key: toText(id) || String(index),
        keyFromId: !!toText(id),
        title,
        image,
        avatarName,
        meta: metaSpecs
          .map((spec) => recordMetaPart(row, spec, f.currency))
          .filter(Boolean)
          .join(' · '),
        status: isNonBlankString(f.statusField) ? toText(row[f.statusField]) : '',
        value: isNonBlankString(f.valueField) ? formatValue(row[f.valueField], format, f.currency) : '',
        progress: isNonBlankString(f.progressField) ? percentOf(row[f.progressField]) : null,
        row,
        index,
      },
    ];
  });
  return uniqueKeys(
    items.map(({ keyFromId, ...item }) => item),
    items.map((item) => item.keyFromId),
    { byOccurrence: true }
  );
};
