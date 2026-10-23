// The UI 2.0 options list editor's model: a fixed list of options read from, and written back to, the same code value
// the options field has always held ({{['A', 'B']}} or {{[{ label: 'A', value: 'a' }]}}). No React and no eval: the
// code is read by a small parser that takes JavaScript literals only, so anything else (a binding to a query, a
// component, a .map) is refused and the field stays in code.

const isScalar = (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// ---- Literal parser ------------------------------------------------------------------------------------------------

const KEYWORDS = { true: true, false: false, null: null, undefined: undefined };
const ESCAPES = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };

class LiteralError extends Error {}

/** A JavaScript literal (arrays, objects, strings, numbers, true, false, null) from text; throws on anything else. */
export const parseLiteral = (text) => {
  const src = String(text);
  let i = 0;
  const fail = (what) => {
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
  const string = () => {
    const quote = src[i++];
    let out = '';
    while (i < src.length && src[i] !== quote) {
      const ch = src[i++];
      if (quote === '`' && ch === '$' && src[i] === '{') fail('Template expression');
      if (ch === '\n' && quote !== '`') fail('Line break in string');
      if (ch !== '\\') {
        out += ch;
        continue;
      }
      const esc = src[i++];
      if (esc === undefined) break;
      if (esc in ESCAPES && !(esc === '0' && /\d/.test(src[i] ?? ''))) out += ESCAPES[esc];
      else if (esc === 'x') {
        const hex = src.slice(i, i + 2);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) fail('Bad escape');
        out += String.fromCharCode(parseInt(hex, 16));
        i += 2;
      } else if (esc === 'u') {
        const braced = src[i] === '{';
        const hex = braced ? src.slice(i + 1, src.indexOf('}', i)) : src.slice(i, i + 4);
        if (!/^[0-9a-fA-F]{1,6}$/.test(hex) || (!braced && hex.length !== 4)) fail('Bad escape');
        out += String.fromCodePoint(parseInt(hex, 16));
        i += braced ? hex.length + 2 : 4;
      } else if (esc === '\r' || esc === '\n') {
        if (esc === '\r' && src[i] === '\n') i++;
      } else out += esc;
    }
    if (src[i] !== quote) fail('Unclosed string');
    i++;
    return out;
  };
  const number = () => {
    const match = /^[+-]?(0[xX][0-9a-fA-F]+|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)/.exec(src.slice(i));
    if (!match) fail('Bad number');
    i += match[0].length;
    const body = match[0].replace(/^[+-]/, '');
    const n = /^0[xX]/.test(body) ? parseInt(body, 16) : Number(body);
    return match[0][0] === '-' ? -n : n;
  };
  const identifier = () => {
    const match = /^[A-Za-z_$][\w$]*/.exec(src.slice(i));
    if (!match) fail('Unexpected token');
    i += match[0].length;
    return match[0];
  };
  const value = () => {
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
  const array = () => {
    i++;
    const out = [];
    for (;;) {
      skip();
      if (src[i] === ']') break;
      if (src[i] === ',') fail('Hole in array');
      out.push(value());
      skip();
      if (src[i] === ',') i++;
      else if (src[i] !== ']') fail('Expected , or ]');
    }
    i++;
    return out;
  };
  const object = () => {
    i++;
    const out = {};
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

// ---- Literal writer ------------------------------------------------------------------------------------------------

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const NAMED_ESCAPES = { '\\': '\\\\', "'": "\\'", '\n': '\\n', '\r': '\\r', '\t': '\\t' };

const escapeChar = (ch) => {
  if (NAMED_ESCAPES[ch]) return NAMED_ESCAPES[ch];
  const code = ch.charCodeAt(0);
  return code < 0x20 || code === 0x2028 || code === 0x2029 ? `\\u${code.toString(16).padStart(4, '0')}` : ch;
};

const formatString = (s) => {
  const body = Array.from(s, escapeChar)
    .join('')
    // `{{` and `}}` inside a string would end the binding around the list early: written as escapes, they read the same.
    .replace(/\{\{/g, '{\\x7b')
    .replace(/\}\}/g, '}\\x7d');
  return `'${body}'`;
};

/** A value as JavaScript literal text, in the configs' style: {{[{ label: 'One', value: 1 }]}}. */
export const formatLiteral = (v) => {
  if (typeof v === 'string') return formatString(v);
  if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
  if (typeof v === 'boolean' || v === null) return String(v);
  if (v === undefined) return 'undefined';
  if (Array.isArray(v)) return `[${v.map(formatLiteral).join(', ')}]`;
  const entries = Object.entries(v);
  if (!entries.length) return '{}';
  return `{ ${entries
    .map(([k, x]) => `${IDENTIFIER.test(k) ? k : formatString(k)}: ${formatLiteral(x)}`)
    .join(', ')} }`;
};

// ---- Options code --------------------------------------------------------------------------------------------------

export const BLOCKED = {
  bound:
    'These options come from code, such as a query or another component, so they stay in code. The list edits a fixed list.',
  notList: 'These options are not a list, so they stay in code.',
  entry: (n) =>
    `Option ${n} is not text, a number, true/false or a { label, value } object, so the options stay in code.`,
};

/** An entry the list can edit: text, a number, true/false, or an object whose label and value are one of those. */
const isEditableEntry = (e) =>
  isScalar(e) ||
  (isPlainObject(e) &&
    (e.label === undefined || isScalar(e.label)) &&
    (e.value === undefined || e.value === null || isScalar(e.value)) &&
    (isScalar(e.label) || isScalar(e.value)));

/** The options as a list of entries ({ entries }), or why the list cannot edit them ({ reason }). */
export const readOptionsCode = (code) => {
  let parsed;
  if (Array.isArray(code)) parsed = code;
  else if (code === undefined || code === null || (typeof code === 'string' && code.trim() === '')) parsed = [];
  else if (typeof code !== 'string') return { reason: BLOCKED.notList };
  else {
    const match = /^\s*\{\{([\s\S]*)\}\}\s*$/.exec(code);
    if (!match) return { reason: BLOCKED.notList };
    try {
      parsed = parseLiteral(match[1]);
    } catch (e) {
      if (e instanceof LiteralError) return { reason: BLOCKED.bound };
      throw e;
    }
  }
  if (!Array.isArray(parsed)) return { reason: BLOCKED.notList };
  const bad = parsed.findIndex((e) => !isEditableEntry(e));
  if (bad !== -1) return { reason: BLOCKED.entry(bad + 1) };
  return { entries: parsed };
};

/** Why the list cannot edit these options, or null when it can. */
export const optionsListBlockReason = (code) => readOptionsCode(code).reason ?? null;

/** Entries as the options code value. */
export const writeOptionsCode = (entries) => `{{${formatLiteral(entries)}}}`;

// ---- One entry -----------------------------------------------------------------------------------------------------

/** The value an entry stands for (an object without one falls back to its label, as the widgets do). */
export const entryValue = (e) => (isPlainObject(e) ? e.value ?? e.label : e);

/** The text an entry is drawn with. */
export const entryLabel = (e) => {
  if (!isPlainObject(e)) return String(e);
  const label = isScalar(e.label) ? e.label : entryValue(e);
  return label === undefined || label === null ? '' : String(label);
};

/** True for a disabled entry: `disabled` or the native `disable` (pickersModel isDisabledOption). */
export const isDisabledEntry = (e) => isPlainObject(e) && (e.disabled === true || e.disable === true);

/** 'string', 'number' or 'boolean': the type an entry's value is written with. */
export const entryValueType = (e) => {
  const v = entryValue(e);
  return typeof v === 'number' || typeof v === 'boolean' ? typeof v : 'string';
};

const asObject = (e) => (isPlainObject(e) ? { ...e } : { label: String(e), value: e });

/** The entry with a new label. A value that is the same text as the label follows it (a plain 'A' stays plain). */
export const withLabel = (e, label) => {
  if (typeof e === 'string') return label;
  if (!isPlainObject(e)) return label === String(e) ? e : { label, value: e };
  const next = { ...e };
  const linked = typeof e.value === 'string' && e.value === entryLabel(e);
  if ('label' in e || !linked) next.label = label;
  if (linked) next.value = label;
  return next;
};

/** The entry with a new value. A plain entry becomes { label, value } when its value no longer reads as its label. */
export const withValue = (e, value) => {
  if (!isPlainObject(e)) {
    if (typeof e === typeof value && String(value) === String(e)) return e;
    if (typeof e !== 'string' && typeof value === typeof e) return value;
    return { label: String(e), value };
  }
  return { ...e, value };
};

/** The entry disabled or not, under the key it already uses (`disabled`, or the native `disable`). */
export const withDisabled = (e, on) => {
  if (on) {
    const next = asObject(e);
    const key = 'disabled' in next || !('disable' in next) ? 'disabled' : 'disable';
    next[key] = true;
    return next;
  }
  if (!isPlainObject(e)) return e;
  const next = { ...e };
  if (next.disabled === true) delete next.disabled;
  if (next.disable === true) delete next.disable;
  return next;
};

/** `text` as a value of `type`: undefined when it cannot be one (a number field holding 'abc'). */
export const coerceValue = (text, type) => {
  if (type === 'number') {
    const t = String(text).trim();
    if (t === '' || !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return undefined;
    return Number(t);
  }
  if (type === 'boolean') return text === true || text === 'true';
  return String(text);
};

/** A value moved to another type: text keeps its characters, a number its digits (0 when there are none). */
export const convertValue = (v, type) => {
  if (type === 'string') return v === undefined || v === null ? '' : String(v);
  if (type === 'boolean') return v === true || v === 'true';
  const n = typeof v === 'boolean' ? Number(v) : coerceValue(v ?? '', 'number');
  return n === undefined ? 0 : n;
};

/** The entry a new row starts with: plain text in a list of plain text, the next number in a numbered list, or
 *  { label, value } with the value following the label until it is set apart. Label and value are both new. */
export const newEntry = (entries) => {
  const labels = new Set(entries.map(entryLabel));
  const values = new Set(entries.map((e) => String(entryValue(e))));
  let n = entries.length + 1;
  while (labels.has(`Option ${n}`) || values.has(`Option ${n}`)) n++;
  const label = `Option ${n}`;
  if (entries.length && entries.every((e) => typeof e === 'string')) return label;
  const numbers = entries.map(entryValue);
  if (numbers.length && numbers.every((v) => typeof v === 'number')) {
    return { label, value: Math.max(...numbers.filter(Number.isFinite), 0) + 1 };
  }
  if (!entries.length) return label;
  return { label, value: label };
};

/** The list with the entry at `from` moved to `to`. */
export const moveEntry = (entries, from, to) => {
  const next = [...entries];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

// ---- Default selection ---------------------------------------------------------------------------------------------

/** The values a default value selects ({ values }), or { bound: true } when it is worked out by code. Text written
 *  plainly (Standard) is one value; {{…}} holds a value or a list of them. */
export const readDefaultValues = (code) => {
  let v = code;
  if (typeof code === 'string' && code.includes('{{')) {
    const match = /^\s*\{\{([\s\S]*)\}\}\s*$/.exec(code);
    if (!match) return { bound: true, values: [] };
    try {
      v = parseLiteral(match[1]);
    } catch (e) {
      if (e instanceof LiteralError) return { bound: true, values: [] };
      throw e;
    }
  }
  const list = Array.isArray(v) ? v : [v];
  return { bound: false, values: list.filter((x) => isScalar(x) && x !== '') };
};

/** A default value as its code: plain text for text (as typed in the field), {{…}} for anything else. */
export const writeDefault = (values, multiple) => {
  if (multiple) return `{{${formatLiteral(values)}}}`;
  const [v] = values;
  if (v === undefined || v === '') return '';
  return typeof v === 'string' && !v.includes('{{') && v.trim() === v ? v : `{{${formatLiteral(v)}}}`;
};
