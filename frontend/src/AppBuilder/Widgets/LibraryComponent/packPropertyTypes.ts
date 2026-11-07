import type { ManifestProp } from '@/AppBuilder/types/libraryComponent.types';

// A pack property can be bound to anything a query returns, and a pack component reads its properties as the type its
// hook declares (useStateString, useStateNumber, ...). A value of another type reached it as bound: a query row bound
// to a text property crashed the widget (React cannot draw an object) or showed [object Object], and "5" bound to a
// number stayed text. Each property now gets a value of the type its manifest declares, converted as a native widget's
// property is (component-properties-validation.js): a number becomes text, numeric text a number, 'true'/'false' a
// boolean, JSON text an array or object. A value that cannot be converted becomes the type's empty value, as an empty
// binding does, so a component's sample data never stands in for a bad result, and the debugger says why.

export type PropertyType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enumeration';

// The properties that take more than one type on purpose, by pack, component and property: the declared type first.
// A value of any of these types reaches the component as it is; another is converted to the first that takes it.
// Found by reading each pack's components for a property handled as another type than its hook's.
const ACCEPTS: Record<string, PropertyType[]> = {
  // A number, or [start, end] for a range.
  'shadcn.Slider.defaultValue': ['number', 'array'],
  'shadcn.Slider.value': ['number', 'array'],
  'antd.Slider.value': ['number', 'array'],
  'mui.Slider.value': ['number', 'array'],
  // One value, or several (a multi-select group, a date range).
  'shadcn.ButtonGroup.value': ['string', 'array'],
  'shadcn.DatePicker.defaultValue': ['string', 'array'],
  'shadcn.DatePicker.value': ['string', 'array'],
  'antd.Select.value': ['string', 'array'],
  'antd.TreeSelect.value': ['string', 'array'],
  'mui.ToggleButtonGroup.value': ['string', 'array'],
  // A list, or the same list as text ("a, b, c"; Hero's facts joined by " · ").
  'shadcn.Avatar.names': ['string', 'array'],
  'shadcn.Hero.meta': ['array', 'string'],
  'shadcn.Sparkline.data': ['array', 'string'],
  'shadcn.Tags.tags': ['array', 'string', 'number'],
  'shadcn.TagsInput.defaultValue': ['array', 'string'],
  'shadcn.TagsInput.values': ['array', 'string'],
  // A figure, as a number (formatted by the component) or as text ("12%", "$1,200").
  'shadcn.Stat.value': ['string', 'number'],
  'antd.Statistic.value': ['string', 'number'],
  'mui.StatCard.value': ['string', 'number'],
  'mui.StatCard.trendLabel': ['string', 'number'],
  // The picked option, or the typed text of a free-solo Autocomplete.
  'mui.Autocomplete.value': ['object', 'string'],
  // One y field ('sales') or several (['sales', 'cost']), each a series.
  ...Object.fromEntries(
    ['Column', 'Line', 'Area', 'Bar', 'DualAxes', 'Funnel', 'Radar', 'Scatter'].map((chart) => [
      `antd.${chart}.yField`,
      ['array', 'string'] as PropertyType[],
    ])
  ),
};

const TYPES: PropertyType[] = ['string', 'number', 'boolean', 'array', 'object', 'enumeration'];
const asType = (type: unknown): PropertyType | null =>
  TYPES.includes(type as PropertyType) ? (type as PropertyType) : null;

export const acceptedTypes = (pack: string, component: string, prop: ManifestProp): PropertyType[] | null => {
  const declared = asType(prop.type);
  if (!declared) return null;
  return ACCEPTS[`${pack}.${component}.${prop.name}`] ?? [declared];
};

const isPlainObject = (value: unknown): boolean => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

// What each type is empty as: what a hook clears to, and what an empty binding gives.
const empty = (type: PropertyType): unknown => {
  switch (type) {
    case 'number':
      return null;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return '';
  }
};

const isType = (type: PropertyType, value: unknown): boolean => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    // An object property also takes rows (a Key-Value's data is either), as the native object schema does.
    case 'object':
      return !!value && typeof value === 'object';
    // A role value can set a look as { variant, color } (MUI's lookOf).
    case 'enumeration':
      return typeof value === 'string' || isPlainObject(value);
  }
};

// Numeric text as the packs read it (lib/format toNumber): thousands commas and a trailing % are allowed.
const NUMERIC = /^[-+]?\d*\.?\d+(e[-+]?\d+)?%?$/i;

const parseJson = (text: string, open: string[]): unknown => {
  const t = text.trim();
  if (!open.includes(t[0])) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
};

const NOT = Symbol('not converted');

// The value as `type`, or NOT when it has no such reading.
const convert = (type: PropertyType, value: unknown): unknown => {
  switch (type) {
    case 'string':
    case 'enumeration':
      return typeof value === 'number' || typeof value === 'boolean' ? String(value) : NOT;
    case 'number': {
      if (typeof value === 'boolean') return NOT;
      const t = typeof value === 'string' ? value.trim().replace(/,/g, '') : '';
      if (!NUMERIC.test(t)) return NOT;
      const n = Number(t.replace('%', ''));
      return Number.isFinite(n) ? n : NOT;
    }
    case 'boolean': {
      if (typeof value === 'string') {
        const t = value.trim().toLowerCase();
        if (t === 'true') return true;
        if (t === 'false') return false;
        return NOT;
      }
      return typeof value === 'number' ? value !== 0 : NOT;
    }
    case 'array': {
      const parsed = typeof value === 'string' ? parseJson(value, ['[']) : undefined;
      return Array.isArray(parsed) ? parsed : NOT;
    }
    case 'object': {
      const parsed = typeof value === 'string' ? parseJson(value, ['{', '[']) : undefined;
      return parsed && typeof parsed === 'object' ? parsed : NOT;
    }
  }
};

// The value as the error shows it: the start of it only, so a query's thousands of rows bound to a text property are
// not stringified on every change (the props are converted each time any of them changes).
const PREVIEW_ITEMS = 3;
const PREVIEW_CHARS = 200;
const describe = (value: unknown): string => {
  let sample = value;
  let more = '';
  if (Array.isArray(value) && value.length > PREVIEW_ITEMS) {
    sample = value.slice(0, PREVIEW_ITEMS);
    more = ` (${value.length} items)`;
  } else if (isPlainObject(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > PREVIEW_ITEMS * 4) {
      sample = Object.fromEntries(entries.slice(0, PREVIEW_ITEMS * 4));
      more = ` (${entries.length} keys)`;
    }
  }
  let text: string;
  try {
    text = JSON.stringify(sample) ?? String(sample);
  } catch {
    text = String(sample);
  }
  if (text.length > PREVIEW_CHARS) text = `${text.slice(0, PREVIEW_CHARS)}…`;
  return more ? `${text} …${more}` : text;
};

export type PropertyResult = { value: unknown; error?: string };

/** A bound value as a property of these types takes it (the first is the declared one). */
export const toPropertyType = (value: unknown, types: PropertyType[]): PropertyResult => {
  const declared = types[0];
  // Unset: the hook decides (a property the app never set starts at its own initial value).
  if (value === undefined) return { value };
  const takesText = types.includes('string') || types.includes('enumeration');
  // Empty (null, blank text where text is not taken, NaN from a query not loaded yet): the type's empty value.
  if (
    value === null ||
    (typeof value === 'number' && Number.isNaN(value)) ||
    (typeof value === 'string' && !value.trim() && !takesText)
  )
    return { value: empty(declared) };
  if (types.some((type) => isType(type, value))) return { value };
  for (const type of types) {
    const converted = convert(type, value);
    if (converted !== NOT) return { value: converted };
  }
  const expected = types.length > 1 ? `one of ${types.join(', ')}` : declared;
  return { value: empty(declared), error: `Expected a value of type ${expected}, but received ${describe(value)}` };
};

export type PropertyError = { property: string; label: string; message: string; value: unknown; effective: unknown };

/**
 * A built-in pack component's bound props, each as the type its manifest declares. Props the manifest does not list,
 * and `skip` (row templates, resolved per row by the component), reach it as they are.
 */
export const typedPackProps = (
  pack: string,
  component: string,
  manifestProps: ManifestProp[] | undefined,
  props: Record<string, unknown>,
  skip: Set<string> = new Set()
): { props: Record<string, unknown>; errors: PropertyError[] } => {
  const byName = new Map((manifestProps ?? []).map((prop) => [prop.name, prop]));
  const errors: PropertyError[] = [];
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props)) {
    const prop = byName.get(name);
    const types = prop && !skip.has(name) ? acceptedTypes(pack, component, prop) : null;
    if (!prop || !types) {
      out[name] = value;
      continue;
    }
    const result = toPropertyType(value, types);
    out[name] = result.value;
    if (result.error)
      errors.push({ property: name, label: prop.label ?? name, message: result.error, value, effective: result.value });
  }
  return { props: out, errors };
};
