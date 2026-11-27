// The Cypress panel audit bundles this file too, so it must stay free of imports.

function readColor(text) {
  if (text === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const hex = text.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) {
    const digits = hex[1].length <= 4 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    const byte = (i) => parseInt(digits.slice(i, i + 2), 16);
    return { r: byte(0), g: byte(2), b: byte(4), a: digits.length === 8 ? byte(6) / 255 : 1 };
  }
  const fn = text.match(/^(rgba?|hsla?)\((.+)\)$/);
  if (!fn) return null;
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const number = (part, scale) => (part.endsWith('%') ? (parseFloat(part) / 100) * scale : Number(part));
  const a = parts[3] === undefined ? 1 : number(parts[3], 1);
  if (fn[1].startsWith('rgb')) {
    const [r, g, b] = parts.slice(0, 3).map((part) => number(part, 255));
    return { r, g, b, a };
  }
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const channel = (n) => {
    const k = (n + h / 30) % 12;
    return (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return { r: channel(0), g: channel(8), b: channel(4), a };
}

export function parseColor(value) {
  const colour = readColor(String(value).trim().toLowerCase());
  if (!colour || !Object.values(colour).every(Number.isFinite)) throw new Error(`Unsupported colour: ${value}`);
  return colour;
}

function over(top, bottom) {
  const a = top.a + bottom.a * (1 - top.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (key) => (top[key] * top.a + bottom[key] * bottom.a * (1 - top.a)) / a;
  return { r: mix('r'), g: mix('g'), b: mix('b'), a };
}

function luminance({ r, g, b }) {
  const linear = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

// Backgrounds are listed top layer first; translucent layers are flattened onto white.
export function contrastRatio(fg, ...backgrounds) {
  const bg = [...backgrounds, '#ffffff'].map(parseColor).reduceRight((below, layer) => over(layer, below));
  const [hi, lo] = [luminance(over(parseColor(fg), bg)), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Matches `selector` at any nesting depth (so `&.selected` works); the last declaration wins, as in
// the cascade.
export function readToken(scss, selector, name) {
  const src = scss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const stack = [];
  let start = 0;
  let value;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '{') {
      stack.push(
        src
          .slice(start, i)
          .split(',')
          .map((s) => s.trim())
      );
      start = i + 1;
    } else if (c === ';' || c === '}') {
      const decl = src
        .slice(start, i)
        .trim()
        .match(/^([\w-]+)\s*:\s*([\s\S]+)$/);
      if (decl && decl[1] === name && stack.at(-1)?.includes(selector)) {
        value = decl[2].replace(/\s*!important$/, '').trim();
      }
      if (c === '}') stack.pop();
      start = i + 1;
    }
  }
  return value;
}
