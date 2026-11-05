// Value helpers of UI 2.0's _shared/values.ts and _shared/avatarHue.ts, for the Chat and the Questionnaire.

export const isScalar = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

/** Text for a scalar, '' for anything else (an object is never shown as [object Object]). */
export const toText = (v: unknown): string => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));

const on = (v: unknown): boolean => v === true || v === 'true';
export const truthy = on;

const LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel', 'sms']);
// eslint-disable-next-line no-control-regex
const IGNORED_IN_SCHEME = /[\s\u0000-\u001f]/g;
const schemeOf = (url: string): string | null =>
  url
    .replace(IGNORED_IN_SCHEME, '')
    .match(/^([a-z][a-z0-9+.-]*):/i)?.[1]
    .toLowerCase() ?? null;

/** A link that cannot run script: http(s), mailto, tel, sms or a relative URL; '' for anything else. */
export const safeUrl = (v: unknown): string => {
  const url = toText(v).trim();
  if (!url) return '';
  const scheme = schemeOf(url);
  return scheme === null || LINK_SCHEMES.has(scheme) ? url : '';
};

/** An image source: a safe link, a data:image URL or a blob URL. */
export const safeImageUrl = (v: unknown): string => {
  const url = toText(v).trim();
  return /^data:image\//i.test(url) || schemeOf(url) === 'blob' ? url : safeUrl(url);
};

/** A stable hue for a name, so a person keeps one avatar colour (seven hues 51 degrees apart). */
export const avatarHue = (name: unknown): number => {
  const text = typeof name === 'string' ? name : String(name ?? '');
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return ((hash >>> 0) % 7) * 51 + 12;
};

/** Two initials, of the first and the last word with a letter ("Yusuf & Leyla Demir" reads YD). */
export const initials = (name: unknown): string => {
  const tokens = String(name || '').split(/\s+/);
  const lettered = tokens.filter((w) => /\p{L}/u.test(w));
  const words = (lettered.length ? lettered : tokens).map((w) => w.match(/[\p{L}\p{N}]/u)?.[0]).filter(Boolean);
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picked.join('').toUpperCase();
};

/** UI 2.0's typeface presets (looks/typeLook.ts): '' for the theme font, a preset's stack, or the author's own
 *  family names with a generic fallback. */
const FONT_STACKS: Record<string, string> = {
  sans: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
  display: "Didot, 'Bodoni 72', 'Bodoni MT', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
export const fontStack = (value: unknown): string => {
  if (value === undefined || value === null || typeof value === 'object' || !String(value).trim()) return '';
  const key = String(value).trim().toLowerCase();
  if (key === 'theme') return '';
  if (FONT_STACKS[key]) return FONT_STACKS[key];
  const own = String(value)
    .replace(/[^\w\s,'"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  if (!/[A-Za-z]/.test(own)) return '';
  return /(serif|monospace|cursive|fantasy|system-ui)\s*$/.test(own) ? own : `${own}, sans-serif`;
};

/** Builder styles as CSS variables on the root: each set value becomes its variable, an unset one is left out so the
 *  stylesheet's fallback applies (UI 2.0's LOOKS). */
export const lookVars = (pairs: [unknown, string, ((v: unknown) => string)?][]): Record<string, string> => {
  const vars: Record<string, string> = {};
  for (const [value, name, map] of pairs) {
    if (value === undefined || value === null || String(value).trim() === '') continue;
    const out = map ? map(value) : String(value);
    if (out) vars[name] = out;
  }
  return vars;
};

/** A CSS length: a bare number in px, anything else as written. */
export const px = (v: unknown): string => (/^\d+(\.\d+)?$/.test(String(v).trim()) ? `${v}px` : String(v));
