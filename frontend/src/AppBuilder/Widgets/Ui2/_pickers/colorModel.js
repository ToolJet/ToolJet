// shadcn/ui pack (experiment): pure colour logic of the Color picker widget. No React here: every function takes
// junk (null, wrong types, huge numbers) without throwing.

import { asList, isText } from './pickersModel';

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
