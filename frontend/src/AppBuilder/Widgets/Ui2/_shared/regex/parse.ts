// ToolJet UI 2.0: an author's pattern read into a tree both matchers run (regex/linear.ts, regex/backtrack.ts). The
// browser has already accepted the pattern (boundedRegex checks it first), so this reads valid ECMAScript syntax,
// web-compatibility forms included (a literal {, \8, legacy octal escapes, a quantified lookahead). Single characters
// are left to the browser (regex/chars.ts); the structure (groups, alternatives, repeats, lookaround, backreferences,
// assertions) is read here. A construct read differently would change answers, so anything not understood throws.
import { anyChar, isLineEnd, literalChar, nativeChar, notLineEnd, wordChar } from './chars';
import type { CharTest } from './chars';

/** Text as the matchers read it: code units, or code points with the u or v flag. */
export type Codes = ArrayLike<number>;

export type Node =
  | { k: 'char'; test: CharTest }
  | { k: 'assert'; holds: (codes: Codes, pos: number) => boolean }
  | { k: 'seq'; items: Node[] }
  | { k: 'alt'; options: Node[] }
  | { k: 'group'; index: number; node: Node }
  // first and count: the capture groups inside, reset when the node starts again.
  | { k: 'look'; behind: boolean; negate: boolean; node: Node; first: number; count: number }
  | { k: 'backref'; groups: number[]; same: (a: number, b: number) => boolean }
  | { k: 'rep'; node: Node; min: number; max: number; greedy: boolean; first: number; count: number };

export interface Parsed {
  root: Node;
  /** The number of capture groups. */
  groups: number;
  /** Whether text is read by code point (the u or v flag). */
  unicode: boolean;
}

/** Thrown for a construct the matchers do not run: the pattern's result is then 'unsupported', never a guess. */
export class Unsupported extends Error {}
const unsupported = (): never => {
  throw new Unsupported();
};

// Properties of strings (v flag only) match several characters at once; one-character tests cannot answer them.
const STRING_PROPERTY =
  /\\[pP]\{(Basic_Emoji|Emoji_Keycap_Sequence|RGI_Emoji_Modifier_Sequence|RGI_Emoji_Flag_Sequence|RGI_Emoji_Tag_Sequence|RGI_Emoji_ZWJ_Sequence|RGI_Emoji)\}/;
const QUANTIFIER = /\{(\d+)(,(\d*))?\}/y;
const HEX4 = /^[0-9a-fA-F]{4}$/;

// A group name with its \u escapes read, so (?<a>x) and \k<a> agree.
const groupName = (raw: string) =>
  raw.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, braced, four) =>
    String.fromCodePoint(parseInt(braced ?? four, 16))
  );

// Every capture group's name (null when unnamed), in the order their ( appear: a backreference may come first.
const scanGroups = (src: string, sets: boolean): (string | null)[] => {
  const names: (string | null)[] = [];
  let depth = 0;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '\\') i += 1;
    else if (ch === '[') depth = sets ? depth + 1 : 1;
    else if (ch === ']' && depth > 0) depth -= 1;
    else if (ch === '(' && depth === 0) {
      if (src[i + 1] !== '?') names.push(null);
      else if (src[i + 2] === '<' && src[i + 3] !== '=' && src[i + 3] !== '!') {
        names.push(groupName(src.slice(i + 3, src.indexOf('>', i))));
      }
    }
  }
  return names;
};

export const parse = (src: string, flags: string): Parsed => {
  const sets = flags.includes('v');
  const unicode = sets || flags.includes('u');
  const names = scanGroups(src, sets);
  const named = names.some((n) => n !== null);
  // The flags a part of the pattern runs with; a modifier group, (?i:...), changes them inside it.
  let mode = { i: flags.includes('i'), m: flags.includes('m'), s: flags.includes('s') };
  const charFlags = () => `${mode.i ? 'i' : ''}${sets ? 'v' : unicode ? 'u' : ''}`;
  let captures = 0;
  let i = 0;

  const next = (): number => {
    const c = (unicode ? src.codePointAt(i) : src.charCodeAt(i)) ?? 0;
    i += c > 0xffff ? 2 : 1;
    return c;
  };
  const char = (test: CharTest): Node => ({ k: 'char', test });
  const literal = (code: number): Node => char(literalChar(code, charFlags()));
  const backref = (groups: number[]): Node => {
    const flagsHere = charFlags();
    const same = mode.i
      ? (a: number, b: number) => a === b || literalChar(a, flagsHere)(b)
      : (a: number, b: number) => a === b;
    return { k: 'backref', groups, same };
  };

  // Where an escape that stands for characters ends; at is just past the backslash.
  const escapeEnd = (at: number): number => {
    const ch = src[at];
    if (ch === 'x') return /^[0-9a-fA-F]{2}$/.test(src.slice(at + 1, at + 3)) ? at + 3 : at + 1;
    if (ch === 'u') {
      if (unicode && src[at + 1] === '{') return src.indexOf('}', at) + 1;
      if (!HEX4.test(src.slice(at + 1, at + 5))) return at + 1;
      const lead = parseInt(src.slice(at + 1, at + 5), 16);
      const pair = unicode && lead >= 0xd800 && lead <= 0xdbff && src.startsWith('\\u', at + 5);
      const trail = pair && HEX4.test(src.slice(at + 7, at + 11)) ? parseInt(src.slice(at + 7, at + 11), 16) : 0;
      return trail >= 0xdc00 && trail <= 0xdfff ? at + 11 : at + 5;
    }
    if (ch === 'c') return at + 2;
    if (unicode && (ch === 'p' || ch === 'P')) {
      const end = src.indexOf('}', at) + 1;
      if (STRING_PROPERTY.test(src.slice(at - 1, end))) unsupported();
      return end;
    }
    return at + 1;
  };

  // A backslash outside a class: a word boundary, a backreference, or characters.
  const escape = (): Node => {
    const start = i;
    i += 1;
    const ch = src[i] ?? unsupported();
    if (ch === 'b' || ch === 'B') {
      i += 1;
      const word = wordChar(charFlags());
      const wordAt = (codes: Codes, p: number) => p >= 0 && p < codes.length && word(codes[p]);
      const negate = ch === 'B';
      return { k: 'assert', holds: (codes, p) => (wordAt(codes, p - 1) !== wordAt(codes, p)) !== negate };
    }
    if (ch >= '0' && ch <= '9') {
      const digits = /^\d+/.exec(src.slice(i))?.[0] ?? '';
      if (ch !== '0') {
        const n = Number(digits);
        // Without u, \N past the number of groups is not a backreference: \8 and \9 are digits, the rest octal.
        if (unicode || n <= names.length) {
          i += digits.length;
          return backref([n]);
        }
        if (ch === '8' || ch === '9') {
          i += 1;
          return literal(ch.charCodeAt(0));
        }
      } else if (unicode) {
        i += 1;
        return literal(0);
      }
      const octal = /^(?:[0-3][0-7]{0,2}|[4-7][0-7]?)/.exec(src.slice(i))?.[0] ?? unsupported();
      i += octal.length;
      return literal(parseInt(octal, 8));
    }
    if (ch === 'k' && (unicode || named)) {
      const end = src.indexOf('>', i);
      const name = groupName(src.slice(i + 2, end));
      i = end + 1;
      const groups = names.flatMap((n, index) => (n === name ? [index + 1] : []));
      return groups.length ? backref(groups) : unsupported();
    }
    // Without u, \c with no letter after it is a backslash; the c is read next.
    if (ch === 'c' && !/[a-zA-Z]/.test(src[i + 1] ?? '')) return unicode ? unsupported() : literal(92);
    i = escapeEnd(i);
    return char(nativeChar(src.slice(start, i), charFlags()));
  };

  // A class, [...], given to the browser whole: only where it ends is read here.
  const characterClass = (): Node => {
    const start = i;
    let depth = 0;
    for (; i < src.length; i += 1) {
      const ch = src[i];
      if (ch === '\\') i += 1;
      else if (ch === '[' && (sets || depth === 0)) depth += 1;
      else if (ch === ']' && (depth -= 1) === 0) break;
    }
    if (src[i] !== ']') unsupported();
    i += 1;
    const atom = src.slice(start, i);
    if (sets && (/\\q\{/.test(atom) || STRING_PROPERTY.test(atom))) unsupported();
    return char(nativeChar(atom, charFlags()));
  };

  const group = (): Node => {
    i += 1;
    let node: Node;
    const [c1, c2] = [src[i + 1], src[i + 2]];
    const look = (behind: boolean, negate: boolean, skip: number): Node => {
      i += skip;
      const first = captures + 1;
      const inner = alternation();
      return { k: 'look', behind, negate, node: inner, first, count: captures - first + 1 };
    };
    if (src[i] !== '?') {
      const index = (captures += 1);
      node = { k: 'group', index, node: alternation() };
    } else if (c1 === ':') {
      i += 2;
      node = alternation();
    } else if (c1 === '=' || c1 === '!') node = look(false, c1 === '!', 2);
    else if (c1 === '<' && (c2 === '=' || c2 === '!')) node = look(true, c2 === '!', 3);
    else if (c1 === '<') {
      i = src.indexOf('>', i) + 1;
      const index = (captures += 1);
      node = { k: 'group', index, node: alternation() };
    } else {
      // A modifier group: (?i:...), (?-i:...), (?m-s:...).
      const m = /^\?([ims]*)(?:-([ims]*))?:/.exec(src.slice(i)) ?? unsupported();
      i += m[0].length;
      const outer = mode;
      const set = (f: 'i' | 'm' | 's') => (m[1].includes(f) ? true : (m[2] ?? '').includes(f) ? false : outer[f]);
      mode = { i: set('i'), m: set('m'), s: set('s') };
      node = alternation();
      mode = outer;
    }
    if (src[i] !== ')') unsupported();
    i += 1;
    return node;
  };

  const atom = (): Node => {
    const ch = src[i];
    if (ch === '^') {
      i += 1;
      const multiline = mode.m;
      return { k: 'assert', holds: (codes, p) => p === 0 || (multiline && isLineEnd(codes[p - 1])) };
    }
    if (ch === '$') {
      i += 1;
      const multiline = mode.m;
      return { k: 'assert', holds: (codes, p) => p === codes.length || (multiline && isLineEnd(codes[p])) };
    }
    if (ch === '.') {
      i += 1;
      return char(mode.s ? anyChar : notLineEnd);
    }
    if (ch === '[') return characterClass();
    if (ch === '(') return group();
    if (ch === '\\') return escape();
    return literal(next());
  };

  const quantifier = (): [number, number, boolean] | null => {
    const ch = src[i];
    const simple: Record<string, [number, number]> = { '*': [0, Infinity], '+': [1, Infinity], '?': [0, 1] };
    let range = simple[ch] ?? null;
    if (range) i += 1;
    else if (ch === '{') {
      QUANTIFIER.lastIndex = i;
      const m = QUANTIFIER.exec(src);
      if (!m) return null; // a literal brace
      i = QUANTIFIER.lastIndex;
      range = [Number(m[1]), m[2] ? (m[3] ? Number(m[3]) : Infinity) : Number(m[1])];
    }
    if (!range) return null;
    const lazy = src[i] === '?';
    if (lazy) i += 1;
    return [range[0], range[1], !lazy];
  };

  const sequence = (): Node => {
    const items: Node[] = [];
    while (i < src.length && src[i] !== '|' && src[i] !== ')') {
      const first = captures + 1;
      const node = atom();
      const q = quantifier();
      const count = captures - first + 1;
      items.push(q ? { k: 'rep', node, min: q[0], max: q[1], greedy: q[2], first, count } : node);
    }
    return items.length === 1 ? items[0] : { k: 'seq', items };
  };

  const alternation = (): Node => {
    const options = [sequence()];
    while (src[i] === '|') {
      i += 1;
      options.push(sequence());
    }
    return options.length === 1 ? options[0] : { k: 'alt', options };
  };

  const root = alternation();
  if (i < src.length || captures !== names.length) unsupported();
  return { root, groups: captures, unicode };
};
