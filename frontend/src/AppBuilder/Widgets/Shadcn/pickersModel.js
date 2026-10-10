// shadcn/ui pack (experiment): pure logic of the pickers widgets (Combobox, Multiselect, Tags input, Color picker,
// Rating, File upload). No React here: every function takes junk (null, wrong types, huge numbers) without throwing.
import { stringify } from '../packJson';

const isText = (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
const asList = (v) => (Array.isArray(v) ? v : []);
const clampInt = (v, min, max, fallback) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};

/** A content key for effect dependencies that never throws (circular data gives a fresh key). */
export const stableKey = (v) => {
  try {
    return stringify(v ?? null);
  } catch {
    return String(Math.random());
  }
};

// ---- Options (Combobox, Multiselect) -------------------------------------------------------------------------------

/** The key a selection is stored under: the option value as text, so 1 and '1' name the same option. */
export const keyOf = (v) => String(v);

/** True for an option the author disabled (`disabled` or the native `disable`). */
export const isDisabledOption = (o) => o?.disabled === true || o?.disable === true;

/** The option whose value is `value` (by key), or undefined. */
export const findOption = (options, value) => {
  if (value === undefined || value === null) return undefined;
  const key = keyOf(value);
  return asList(options).find((o) => keyOf(o.value) === key);
};

/** The stored key of a default value: null when nothing is selected (empty, null, or not a text value). */
export const initialKey = (v) => (v === undefined || v === null || v === '' || !isText(v) ? null : keyOf(v));

/** Options matching the search text (label, description, value or group; case-insensitive). */
export const filterOptions = (options, search) => {
  const q = String(search ?? '')
    .trim()
    .toLowerCase();
  const all = asList(options).map((option, index) => ({ option, index }));
  if (!q) return all;
  return all.filter(({ option }) =>
    [option.label, option.description, option.value, option.group].some(
      (field) => isText(field) && String(field).toLowerCase().includes(q)
    )
  );
};

/** Entries ({ option, index }) grouped by the option's `group`, groups in order of first appearance. Ungrouped options
 *  form one group with an empty heading. */
export const groupOptions = (entries) => {
  const groups = [];
  const byName = new Map();
  for (const entry of asList(entries)) {
    const heading = isText(entry?.option?.group) ? String(entry.option.group) : '';
    if (!byName.has(heading)) {
      const group = { heading, items: [] };
      byName.set(heading, group);
      groups.push(group);
    }
    byName.get(heading).items.push(entry);
  }
  return groups;
};

/** What the validation engine should see for a pick: '' when nothing is picked, else a value its mandatory check
 *  reads as filled (it treats 0 and false as empty). */
export const validationInput = (picked, value) => {
  if (!picked) return '';
  if (Array.isArray(value)) return value.length ? value : '';
  return value === 0 || value === false || value === '' ? String(value) || ' ' : value;
};

/** Values as a list: an array as is, one value as a list of one, nothing as []. */
export const toValueList = (v) => {
  if (Array.isArray(v)) return v.filter((x) => isText(x));
  return v === undefined || v === null || v === '' || !isText(v) ? [] : [v];
};

/** A selection limit: 0 means none. */
export const clampLimit = (v) => clampInt(v, 0, 10000, 0);

/** Multiselect keys after adding `values` (unknown values ignored when options are known; at most `limit`). */
export const addKeys = (keys, values, options, limit = 0) => {
  const known = asList(options);
  const next = [...asList(keys)];
  for (const v of toValueList(values)) {
    const key = keyOf(v);
    if (next.includes(key)) continue;
    const option = known.find((o) => keyOf(o.value) === key);
    if (known.length && (!option || isDisabledOption(option))) continue;
    if (limit > 0 && next.length >= limit) break;
    next.push(key);
  }
  return next;
};

export const removeKeys = (keys, values) => {
  const drop = new Set(toValueList(values).map(keyOf));
  return asList(keys).filter((k) => !drop.has(k));
};

/** The options a multiselect shows as selected, in option order. */
export const selectedOf = (options, keys) => {
  const set = new Set(asList(keys));
  return asList(options).filter((o) => set.has(keyOf(o.value)));
};

// ---- Tags ----------------------------------------------------------------------------------------------------------

/** Tags from a list of values or a comma-separated text: trimmed text, empties dropped. */
export const toTags = (v) => {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  return raw
    .filter(isText)
    .map((t) => String(t).trim())
    .filter(Boolean);
};

/** Typed or pasted text split on commas and new lines: { parts (complete entries), rest (what is still typed) }. */
export const splitTyped = (text) => {
  const pieces = String(text ?? '').split(/[,\n\r]/);
  const rest = pieces.pop() ?? '';
  return { parts: pieces.map((p) => p.trim()).filter(Boolean), rest };
};

/** A regular expression from the author's text, or null when it is empty or invalid. */
export const safeRegex = (pattern) => {
  if (pattern instanceof RegExp) return new RegExp(pattern.source, pattern.flags.replace('g', ''));
  if (!isText(pattern) || String(pattern).trim() === '') return null;
  try {
    return new RegExp(String(pattern));
  } catch {
    return null;
  }
};

export const sameTag = (a, b, caseSensitive) =>
  caseSensitive ? String(a) === String(b) : String(a).toLowerCase() === String(b).toLowerCase();

/** Adds candidates to the tags: { tags, added, error }. Duplicates (ignoring case unless caseSensitive), tags that
 *  fail the pattern and tags past maxTags are refused, with the reason in `error`. */
export const addTags = (tags, candidates, { maxTags = 0, caseSensitive = false, pattern, patternError } = {}) => {
  const next = [...toTags(tags)];
  const added = [];
  let error = '';
  const max = clampInt(maxTags, 0, 10000, 0);
  const re = safeRegex(pattern);
  for (const tag of toTags(candidates)) {
    if (next.some((t) => sameTag(t, tag, caseSensitive))) {
      error = `"${tag}" is already added`;
      continue;
    }
    if (re && !re.test(tag)) {
      error = isText(patternError) && String(patternError).trim() ? String(patternError) : `"${tag}" is not valid`;
      continue;
    }
    if (max > 0 && next.length >= max) {
      error = `You can add up to ${max} tag${max === 1 ? '' : 's'}`;
      break;
    }
    next.push(tag);
    added.push(tag);
  }
  return { tags: next, added, error };
};

// ---- Colour --------------------------------------------------------------------------------------------------------

const clamp = (n, min, max) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
const hex2 = (n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');

/** Colour text as '#rrggbb' (or '#rrggbbaa' with allowAlpha and some transparency); null when it is not a colour.
 *  Reads #rgb, #rgba, #rrggbb, #rrggbbaa (with or without '#'), rgb() and rgba(). */
export const normalizeHex = (input, allowAlpha = false) => {
  if (!isText(input)) return null;
  const text = String(input).trim().toLowerCase();
  let r, g, b, a;
  const rgb = text.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (rgb) {
    [r, g, b] = [rgb[1], rgb[2], rgb[3]].map(Number);
    if ([r, g, b].some((n) => !Number.isFinite(n) || n > 255)) return null;
    a = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : Number(rgb[4]);
    a = Math.round(clamp(a, 0, 1) * 255);
  } else {
    let h = text.replace(/^#/, '');
    if (!/^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(h)) return null;
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    a = h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255;
  }
  const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  return allowAlpha && a < 255 ? `${base}${hex2(a)}` : base;
};

/** { r, g, b, a } (a from 0 to 1) of a colour, or null. */
export const hexToRgba = (input) => {
  const hex = normalizeHex(input, true);
  if (!hex) return null;
  const n = (i) => parseInt(hex.slice(i, i + 2), 16);
  return { r: n(1), g: n(3), b: n(5), a: hex.length === 9 ? Math.round((n(7) / 255) * 100) / 100 : 1 };
};

export const rgbaToHex = ({ r, g, b, a = 1 } = {}, allowAlpha = false) => {
  const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  const alpha = Math.round(clamp(Number(a), 0, 1) * 255);
  return allowAlpha && alpha < 255 ? `${base}${hex2(alpha)}` : base;
};

/** The exposed forms of a colour: rgb 'rgb(r, g, b)' and rgba 'rgba(r, g, b, a)' ('' for no colour). */
export const colorForms = (hex) => {
  const c = hexToRgba(hex);
  if (!c) return { rgb: '', rgba: '' };
  return { rgb: `rgb(${c.r}, ${c.g}, ${c.b})`, rgba: `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})` };
};

/** HSV (h 0-360, s and v 0-1) of an RGB colour. */
export const rgbToHsv = ({ r, g, b }) => {
  const [rr, gg, bb] = [r, g, b].map((n) => clamp(Number(n), 0, 255) / 255);
  const max = Math.max(rr, gg, bb);
  const d = max - Math.min(rr, gg, bb);
  let h = 0;
  if (d) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
};

export const hsvToRgb = ({ h, s, v }) => {
  const hh = (((Number(h) || 0) % 360) + 360) % 360;
  const ss = clamp(Number(s), 0, 1);
  const vv = clamp(Number(v), 0, 1);
  const c = vv * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = vv - c;
  const [r, g, b] =
    hh < 60
      ? [c, x, 0]
      : hh < 120
      ? [x, c, 0]
      : hh < 180
      ? [0, c, x]
      : hh < 240
      ? [0, x, c]
      : hh < 300
      ? [x, 0, c]
      : [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
};

/** Black or white, whichever reads better on the colour (for a check mark on a swatch). */
export const contrastOn = (hex) => {
  const c = hexToRgba(hex);
  if (!c) return '#000000';
  const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  return lum > 0.6 || c.a < 0.5 ? '#000000' : '#ffffff';
};

/** The preset swatches: valid colours only, duplicates dropped, at most 64. */
export const toSwatches = (v) => {
  const seen = new Set();
  const out = [];
  for (const entry of asList(v)) {
    const hex = normalizeHex(entry, true);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    out.push(hex);
    if (out.length >= 64) break;
  }
  return out;
};

// ---- Rating --------------------------------------------------------------------------------------------------------

/** The number of icons: 1 to 10, 5 when unset or junk. */
export const clampMax = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && v !== null && v !== '' ? Math.max(1, Math.min(10, n)) : 5;
};

/** A rating between 0 and max, in whole steps (or halves with allowHalf). */
export const normalizeRating = (v, max = 5, allowHalf = false) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const step = allowHalf ? Math.round(n * 2) / 2 : Math.round(n);
  return Math.max(0, Math.min(clampMax(max), step));
};

/** How icon `position` (1-based) draws for a value: 'full', 'half' or 'empty'. */
export const iconFill = (position, value) => {
  if (value >= position) return 'full';
  if (value >= position - 0.5) return 'half';
  return 'empty';
};

/** The rating one keyboard step away (dir +1 or -1), kept between one step and max. */
export const stepRating = (value, dir, max = 5, allowHalf = false) => {
  const step = allowHalf ? 0.5 : 1;
  const next = normalizeRating(value, max, allowHalf) + (dir > 0 ? step : -step);
  return Math.max(step, Math.min(clampMax(max), next));
};

// ---- Files ---------------------------------------------------------------------------------------------------------

/** A byte count as text: '0 B', '512 B', '1.5 KB', '5 MB'. */
export const formatBytes = (n) => {
  const bytes = Number(n);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${i === 0 ? value : Math.round(value * 10) / 10} ${units[i]}`;
};

const EXT_MIME = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  txt: 'text/plain',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  zip: 'application/zip',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
};

/** The accepted types as a list: from 'image/*, .pdf' or ['image/*', '.pdf']. */
export const acceptList = (accept) =>
  (Array.isArray(accept) ? accept : typeof accept === 'string' ? accept.split(',') : [])
    .filter(isText)
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => /^\.[a-z0-9]+$/.test(t) || /^[a-z]+\/[a-z0-9.+*-]+$/.test(t));

/** react-dropzone's accept map ({ mime: [extensions] }); undefined accepts any file. */
export const toDropzoneAccept = (accept) => {
  const types = acceptList(accept);
  if (!types.length) return undefined;
  const map = {};
  for (const t of types) {
    if (t.startsWith('.')) {
      const mime = EXT_MIME[t.slice(1)] || 'application/octet-stream';
      map[mime] = [...(map[mime] || []), t];
    } else if (!map[t]) map[t] = [];
  }
  return map;
};

const MIME_NAME = {
  'image/*': 'Images',
  'video/*': 'Videos',
  'audio/*': 'Audio',
  'text/*': 'Text files',
  'application/pdf': 'PDF',
  'text/csv': 'CSV',
  'text/plain': 'TXT',
  'application/json': 'JSON',
  'image/svg+xml': 'SVG',
  'image/jpeg': 'JPG',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

/** The accepted types in words: 'Images, PDF, CSV' ('' for any file). */
export const acceptHint = (accept) => {
  const names = acceptList(accept).map(
    (t) => MIME_NAME[t] || (t.startsWith('.') ? t.slice(1).toUpperCase() : t.split('/')[1].toUpperCase())
  );
  return [...new Set(names)].join(', ');
};

/** What kind of file it is, for its icon: image, pdf, sheet, text, archive, audio, video or other. */
export const fileKind = (type, name) => {
  const t = String(type ?? '').toLowerCase();
  const ext = (String(name ?? '').match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  if (t.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (t === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (/sheet|excel|csv|tab-separated/.test(t) || ['csv', 'tsv', 'xls', 'xlsx'].includes(ext)) return 'sheet';
  if (t.startsWith('audio/')) return 'audio';
  if (t.startsWith('video/')) return 'video';
  if (/zip|compressed|tar|rar|7z/.test(t) || ['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return 'archive';
  if (t.startsWith('text/') || /json|xml|word|document/.test(t) || ['txt', 'md', 'json', 'doc', 'docx'].includes(ext))
    return 'text';
  return 'other';
};

/** A file count limit: 1 to 100 (default 10). */
export const clampFiles = (v) => clampInt(v, 1, 100, 10);
/** A size limit in bytes: 0 means none. */
export const clampBytes = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** The error line for files react-dropzone refused (or the count limit), naming the first problem. */
export const rejectionMessage = (rejections, { maxSize = 0, minSize = 0, maxFiles = 0 } = {}) => {
  const first = asList(rejections)[0];
  if (!first) return '';
  const name = first.file?.name ? `"${first.file.name}"` : 'A file';
  const code = asList(first.errors)[0]?.code;
  const more = rejections.length > 1 ? ` (${rejections.length} files not added)` : '';
  switch (code) {
    case 'file-too-large':
      return `${name} is larger than ${formatBytes(maxSize)}${more}`;
    case 'file-too-small':
      return `${name} is smaller than ${formatBytes(minSize)}${more}`;
    case 'file-invalid-type':
      return `${name} is not an accepted file type${more}`;
    case 'too-many-files':
      return `You can upload up to ${maxFiles} file${maxFiles === 1 ? '' : 's'}`;
    default:
      return `${name} could not be added${more}`;
  }
};
