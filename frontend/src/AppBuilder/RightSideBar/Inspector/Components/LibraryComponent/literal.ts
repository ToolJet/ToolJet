// The list editors' model: a pack prop's stored code ({{[...]}}, as drop-time stamping writes it, or a literal a person
// or an agent typed) read as a plain value, and a value written back as code. No eval: the code is read by a small
// parser that takes JavaScript literals only, so a binding ({{queries.x.data}}, a .map) is refused and the field stays
// in code.

type Literal = null | undefined | boolean | number | string | Literal[] | { [key: string]: Literal };

const KEYWORDS: Record<string, Literal> = { true: true, false: false, null: null, undefined: undefined };
const ESCAPES: Record<string, string> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };

class LiteralError extends Error {}

/** A JavaScript literal (arrays, objects, strings, numbers, true, false, null) from text; throws on anything else. */
export const parseLiteral = (text: string): Literal => {
  const src = String(text);
  let i = 0;
  const fail = (what: string): never => {
    throw new LiteralError(`${what} at ${i}`);
  };
  const skip = () => {
    for (;;) {
      while (i < src.length && /\s/.test(src[i])) i++;
      if (src.startsWith('//', i)) {
        const end = src.indexOf('\n', i);
        i = end === -1 ? src.length : end + 1;
      } else if (src.startsWith('/*', i)) {
        const end = src.indexOf('*/', i + 2);
        if (end === -1) fail('Unclosed comment');
        i = end + 2;
      } else return;
    }
  };
  const string = (): string => {
    const quote = src[i++];
    let out = '';
    while (i < src.length && src[i] !== quote) {
      const ch = src[i++];
      if (quote === '`' && ch === '$' && src[i] === '{') fail('Template expression');
      if (ch !== '\\') {
        out += ch;
        continue;
      }
      const esc = src[i++];
      if (esc === 'u') {
        const braced = src[i] === '{';
        const hex = braced ? src.slice(i + 1, src.indexOf('}', i)) : src.slice(i, i + 4);
        if (!/^[0-9a-fA-F]{1,6}$/.test(hex) || (!braced && hex.length !== 4)) fail('Bad escape');
        out += String.fromCodePoint(parseInt(hex, 16));
        i += braced ? hex.length + 2 : 4;
      } else if (esc === 'x') {
        const hex = src.slice(i, i + 2);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) fail('Bad escape');
        out += String.fromCharCode(parseInt(hex, 16));
        i += 2;
      } else if (esc !== undefined && esc !== '\n') out += ESCAPES[esc] ?? esc;
    }
    if (src[i] !== quote) fail('Unclosed string');
    i++;
    return out;
  };
  const number = (): number => {
    const match = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
    if (!match) return fail('Bad number');
    i += match[0].length;
    return Number(match[0]);
  };
  const identifier = (): string => {
    const match = /^[A-Za-z_$][\w$]*/.exec(src.slice(i));
    if (!match) return fail('Unexpected token');
    i += match[0].length;
    return match[0];
  };
  const value = (): Literal => {
    skip();
    const ch = src[i];
    if (ch === '[') return array();
    if (ch === '{') return object();
    if (ch === "'" || ch === '"' || ch === '`') return string();
    if (/[\d.+-]/.test(ch ?? '')) return number();
    const word = identifier();
    if (!(word in KEYWORDS)) fail(`Not a literal (${word})`);
    return KEYWORDS[word];
  };
  const array = (): Literal[] => {
    i++;
    const out: Literal[] = [];
    for (;;) {
      skip();
      if (src[i] === ']') break;
      out.push(value());
      skip();
      if (src[i] === ',') i++;
      else if (src[i] !== ']') fail('Expected , or ]');
    }
    i++;
    return out;
  };
  const object = (): { [key: string]: Literal } => {
    i++;
    const out: { [key: string]: Literal } = {};
    for (;;) {
      skip();
      if (src[i] === '}') break;
      const ch = src[i];
      const key = ch === "'" || ch === '"' ? string() : /[\d.]/.test(ch ?? '') ? String(number()) : identifier();
      if (key === '__proto__') fail('Reserved key');
      skip();
      if (src[i] !== ':') fail('Expected :');
      i++;
      out[key] = value();
      skip();
      if (src[i] === ',') i++;
      else if (src[i] !== '}') fail('Expected , or }');
    }
    i++;
    return out;
  };
  const result = value();
  skip();
  if (i < src.length) fail('Unexpected text');
  return result;
};

export interface LiteralRead {
  /** False when the code is a binding or not a literal: the field stays in code. */
  ok: boolean;
  value?: unknown;
}

const BINDING = /^\s*\{\{([\s\S]*)\}\}\s*$/;

/** A stored field value read as a literal: {{<literal>}}, plain JSON text, or other text (an icon name). */
export const readLiteralCode = (code: unknown): LiteralRead => {
  if (code === undefined || code === null || code === '') return { ok: true, value: undefined };
  if (typeof code !== 'string') return { ok: true, value: code };
  const match = BINDING.exec(code);
  if (!match) {
    if (code.includes('{{')) return { ok: false };
    // Plain JSON text (as some saved apps hold a list) reads as its value; any other text is a string.
    if (/^\s*[[{]/.test(code)) {
      try {
        return { ok: true, value: parseLiteral(code) };
      } catch {
        return { ok: false };
      }
    }
    return { ok: true, value: code };
  }
  try {
    return { ok: true, value: parseLiteral(match[1]) };
  } catch {
    return { ok: false };
  }
};

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

// A string as a JavaScript literal that never contains }} (it would end the {{ }} binding early).
const quote = (s: string) => JSON.stringify(s).replace(/\}\}/g, '}\\u007d');

/** A value as compact JavaScript literal text: identifier keys unquoted, spaced so no }} or {{ appears. */
export const writeLiteral = (value: unknown): string => {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'string') return quote(value);
  if (Array.isArray(value)) return `[${value.map(writeLiteral).join(', ')}]`;
  if (typeof value === 'object') {
    const fields = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${IDENTIFIER.test(k) ? k : quote(k)}: ${writeLiteral(v)}`);
    return fields.length ? `{ ${fields.join(', ')} }` : '{}';
  }
  return 'null';
};

/** The stored code for a list or object value: {{[ ... ]}} as drop-time stamping writes it, an object spaced inside. */
export const writeLiteralCode = (value: unknown): string => {
  const text = writeLiteral(value);
  return text.startsWith('{') ? `{{ ${text} }}` : `{{${text}}}`;
};
