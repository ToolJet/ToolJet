// ToolJet UI 2.0: author-supplied regular expressions (a Tags pattern, Table regex filters and conditional-style
// rules) matched with bounded work. The browser's RegExp backtracks: a pattern like ^(a+)+$ takes seconds on 30
// characters, and once a match starts it cannot be stopped. Here a pattern is run by a small linear-time engine
// instead, a Thompson NFA stepped through the text one character at a time (as RE2 does), so the work is at most the
// text length times the pattern's size, whatever the pattern.
// - The browser's own parser checks the pattern first, so a pattern it rejects is rejected here too (null).
// - Constructs with no linear-time run (lookaround, backreferences, Unicode property escapes, the v flag) leave the
//   pattern unsupported: it matches nothing, so a Tags pattern refuses every tag rather than letting all through.
// - The pattern (MAX_PATTERN_LENGTH characters, MAX_PROGRAM steps once {n,m} repeats are written out), the text
//   (MAX_TEXT_LENGTH characters) and the work (text length times program steps, MAX_WORK) are capped: text past
//   either cap does not match. A Table tests a rule against every row as it renders, so one test stays well under a
//   frame's worth of work (a 30-step pattern still reads 10,000 characters).

export const MAX_PATTERN_LENGTH = 2000;
export const MAX_PROGRAM = 2000;
export const MAX_TEXT_LENGTH = 10_000;
export const MAX_WORK = 1_000_000;

/** A pattern ready to test text against, like a RegExp's test (g and y are ignored: no lastIndex is kept). */
export interface BoundedRegex {
  readonly source: string;
  readonly flags: string;
  /** False for a valid pattern the engine cannot run in linear time; it then matches nothing. */
  readonly supported: boolean;
  test(text: unknown): boolean;
}

type CharTest = (c: number) => boolean;
type Assertion = '^' | '$' | 'b' | 'B';
type Node =
  | { k: 'char'; test: CharTest }
  | { k: 'assert'; kind: Assertion }
  | { k: 'seq'; items: Node[] }
  | { k: 'alt'; options: Node[] }
  | { k: 'rep'; node: Node; min: number; max: number };
type Inst =
  | { op: 'char'; test: CharTest }
  | { op: 'assert'; kind: Assertion }
  | { op: 'split'; x: number; y: number }
  | { op: 'jmp'; x: number }
  | { op: 'match' };

class Unsupported extends Error {}
const fail = (): never => {
  throw new Unsupported();
};

const isLineEnd = (c: number) => c === 10 || c === 13 || c === 0x2028 || c === 0x2029;
const isDigit = (c: number) => c >= 48 && c <= 57;
const isWord = (c: number) => isDigit(c) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95;
const SPACES = new Set([9, 10, 11, 12, 13, 32, 0xa0, 0x1680, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff]);
const isSpace = (c: number) => SPACES.has(c) || (c >= 0x2000 && c <= 0x200a);
const not =
  (test: CharTest): CharTest =>
  (c) =>
    !test(c);

// Case-insensitive matching: a character matches when it, or its lower or upper case form, does. Without the u flag
// JavaScript does not map a non-ASCII character to an ASCII one (the Kelvin sign is not k), so neither does this.
const caseForms = new Map<string, number[]>();
const otherCases = (c: number, unicode: boolean): number[] => {
  const key = `${unicode ? 'u' : ''}${c}`;
  const known = caseForms.get(key);
  if (known) return known;
  const s = String.fromCodePoint(c);
  const forms = [s.toLowerCase(), s.toUpperCase()]
    .filter((to) => to !== s && to.length === s.length && (unicode || c < 128 || to.charCodeAt(0) >= 128))
    .map((to) => to.codePointAt(0) ?? 0);
  if (caseForms.size >= 5000) caseForms.clear();
  caseForms.set(key, forms);
  return forms;
};
const folded =
  (test: CharTest, unicode: boolean): CharTest =>
  (c) =>
    test(c) || otherCases(c, unicode).some(test);

const QUANTIFIER = /\{(\d+)(,(\d*))?\}/y;

const parse = (src: string, flags: string): Node => {
  const unicode = flags.includes('u');
  const icase = flags.includes('i');
  const named = /\(\?<[^=!]/.test(src);
  let i = 0;
  const next = (): number => {
    const c = (unicode ? src.codePointAt(i) : src.charCodeAt(i)) ?? 0;
    i += c > 0xffff ? 2 : 1;
    return c;
  };
  const hex = (length: number): number => {
    const digits = src.slice(i, i + length);
    if (digits.length !== length || !/^[0-9a-fA-F]+$/.test(digits)) return -1;
    i += length;
    return parseInt(digits, 16);
  };
  const char = (test: CharTest): Node => ({ k: 'char', test: icase ? folded(test, unicode) : test });
  // What follows a backslash: a character, a class of them, or (outside a class) a word-boundary assertion.
  const escape = (inClass: boolean): number | CharTest | 'b' | 'B' => {
    const ch = src[i];
    if (ch === undefined) fail();
    i += 1;
    const classes: Record<string, CharTest> = {
      d: isDigit,
      D: not(isDigit),
      w: isWord,
      W: not(isWord),
      s: isSpace,
      S: not(isSpace),
    };
    if (classes[ch]) return classes[ch];
    const controls: Record<string, number> = { n: 10, r: 13, t: 9, v: 11, f: 12 };
    if (controls[ch] !== undefined) return controls[ch];
    if (ch === 'b' || ch === 'B') return inClass ? (ch === 'b' ? 8 : 66) : ch;
    if (ch === '0' && !isDigit(src.charCodeAt(i))) return 0;
    if (ch >= '0' && ch <= '9') return fail(); // a backreference, or an old octal escape
    if (ch === 'x') {
      const code = hex(2);
      return code >= 0 ? code : unicode ? fail() : 120;
    }
    if (ch === 'u') {
      if (unicode && src[i] === '{') {
        const end = src.indexOf('}', i);
        const code = parseInt(src.slice(i + 1, end), 16);
        i = end + 1;
        return code;
      }
      const code = hex(4);
      if (code < 0) return unicode ? fail() : 117;
      if (unicode && code >= 0xd800 && code <= 0xdbff && src.startsWith('\\u', i)) {
        const at = i;
        i += 2;
        const low = hex(4);
        if (low >= 0xdc00 && low <= 0xdfff) return (code - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
        i = at;
      }
      return code;
    }
    if (ch === 'c') {
      const letter = src.charCodeAt(i) | 32;
      if (letter >= 97 && letter <= 122) return src.charCodeAt(i++) % 32;
      if (unicode || inClass) fail();
      i -= 1; // \c with no letter is a backslash, then c
      return 92;
    }
    if (ch === 'p' || ch === 'P') return unicode ? fail() : ch.charCodeAt(0);
    if (ch === 'k') return unicode || named ? fail() : 107;
    i -= 1;
    return next();
  };
  const parseClass = (): Node => {
    const negated = src[i] === '^';
    if (negated) i += 1;
    const ranges: [number, number][] = [];
    const sets: CharTest[] = [];
    const add = (item: number | CharTest) => (typeof item === 'number' ? ranges.push([item, item]) : sets.push(item));
    const item = () => (src[i] === '\\' ? (i++, escape(true) as number | CharTest) : next());
    while (i < src.length && src[i] !== ']') {
      const from = item();
      if (src[i] === '-' && i + 1 < src.length && src[i + 1] !== ']') {
        i += 1;
        const to = item();
        if (typeof from === 'number' && typeof to === 'number') {
          if (from > to) fail();
          ranges.push([from, to]);
        } else {
          if (unicode) fail();
          [from, 45, to].forEach(add); // [\d-z] is \d, a dash and z
        }
      } else add(from);
    }
    if (src[i] !== ']') fail();
    i += 1;
    const inRanges: CharTest = (c) => ranges.some(([lo, hi]) => c >= lo && c <= hi) || sets.some((s) => s(c));
    const member = icase ? folded(inRanges, unicode) : inRanges;
    return { k: 'char', test: negated ? not(member) : member };
  };
  const atom = (): Node => {
    const ch = src[i];
    if (ch === '^' || ch === '$') {
      i += 1;
      return { k: 'assert', kind: ch };
    }
    if (ch === '.') {
      i += 1;
      return { k: 'char', test: flags.includes('s') ? () => true : not(isLineEnd) };
    }
    if (ch === '[') {
      i += 1;
      return parseClass();
    }
    if (ch === '(') {
      i += 1;
      if (src[i] === '?') {
        if (src[i + 1] === ':') i += 2;
        else if (src[i + 1] === '<' && src[i + 2] !== '=' && src[i + 2] !== '!') i = src.indexOf('>', i) + 1;
        else fail(); // lookaround, or inline modifiers
      }
      const group = alternation();
      if (src[i] !== ')') fail();
      i += 1;
      return group;
    }
    if (ch === '\\') {
      i += 1;
      const e = escape(false);
      if (e === 'b' || e === 'B') return { k: 'assert', kind: e };
      return typeof e === 'number' ? char((c) => c === e) : char(e);
    }
    const code = next();
    return char((c) => c === code);
  };
  const quantifier = (): [number, number] | null => {
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
    if (range && src[i] === '?') i += 1; // lazy or greedy is the same to test()
    return range;
  };
  const sequence = (): Node => {
    const items: Node[] = [];
    while (i < src.length && src[i] !== '|' && src[i] !== ')') {
      const node = atom();
      const q = quantifier();
      if (q && (q[0] > MAX_PROGRAM || (q[1] !== Infinity && q[1] > MAX_PROGRAM))) fail();
      items.push(q ? { k: 'rep', node, min: q[0], max: q[1] } : node);
    }
    return { k: 'seq', items };
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
  if (i < src.length) fail();
  return root;
};

const compile = (root: Node): Inst[] => {
  const prog: Inst[] = [];
  const emit = (inst: Inst) => {
    if (prog.length >= MAX_PROGRAM) fail();
    return prog.push(inst) - 1;
  };
  const split = () => emit({ op: 'split', x: 0, y: 0 }) as number;
  const at = (pc: number) => prog[pc] as { x: number; y: number };
  const gen = (n: Node) => {
    if (n.k === 'char') emit({ op: 'char', test: n.test });
    else if (n.k === 'assert') emit({ op: 'assert', kind: n.kind });
    else if (n.k === 'seq') n.items.forEach(gen);
    else if (n.k === 'alt') {
      const exits: number[] = [];
      n.options.forEach((option, index) => {
        if (index === n.options.length - 1) return gen(option);
        const s = split();
        at(s).x = prog.length;
        gen(option);
        exits.push(emit({ op: 'jmp', x: 0 }));
        at(s).y = prog.length;
        return undefined;
      });
      exits.forEach((j) => (at(j).x = prog.length));
    } else {
      for (let k = 0; k < n.min; k += 1) gen(n.node);
      if (n.max === Infinity) {
        const s = split();
        at(s).x = prog.length;
        gen(n.node);
        emit({ op: 'jmp', x: s });
        at(s).y = prog.length;
      } else {
        const optional: number[] = [];
        for (let k = n.min; k < n.max; k += 1) {
          const s = split();
          at(s).x = prog.length;
          gen(n.node);
          optional.push(s);
        }
        optional.forEach((s) => (at(s).y = prog.length));
      }
    }
  };
  gen(root);
  emit({ op: 'match' });
  return prog;
};

// Steps every live thread through the text together: each instruction is visited at most once per position.
const run = (prog: Inst[], text: string, flags: string): boolean => {
  const chars = flags.includes('u') ? Array.from(text, (s) => s.codePointAt(0) ?? 0) : null;
  const n = chars ? chars.length : text.length;
  const charAt = (pos: number): number => (chars ? chars[pos] ?? -1 : text.charCodeAt(pos));
  const multiline = flags.includes('m');
  const wordAt = (pos: number) => pos >= 0 && pos < n && isWord(charAt(pos));
  const holds = (kind: Assertion, pos: number) => {
    if (kind === '^') return pos === 0 || (multiline && isLineEnd(charAt(pos - 1)));
    if (kind === '$') return pos === n || (multiline && isLineEnd(charAt(pos)));
    return (wordAt(pos - 1) !== wordAt(pos)) === (kind === 'b');
  };
  const seen = new Int32Array(prog.length).fill(-1);
  const stack: number[] = [];
  // Adds the char instructions reachable from pc at pos to `into`; true when the match is reached.
  const add = (into: number[], from: number, pos: number): boolean => {
    stack.push(from);
    while (stack.length) {
      const pc = stack.pop() ?? 0;
      const inst = prog[pc];
      if (!inst || seen[pc] === pos) continue;
      seen[pc] = pos;
      if (inst.op === 'match') {
        stack.length = 0;
        return true;
      }
      if (inst.op === 'char') into.push(pc);
      else if (inst.op === 'jmp') stack.push(inst.x);
      else if (inst.op === 'split') stack.push(inst.y, inst.x);
      else if (holds(inst.kind, pos)) stack.push(pc + 1);
    }
    return false;
  };
  let threads: number[] = [];
  let following: number[] = [];
  for (let pos = 0; ; pos += 1) {
    if (add(threads, 0, pos)) return true;
    if (pos === n || !threads.length) {
      if (pos === n) return false;
      continue;
    }
    const c = charAt(pos);
    for (const pc of threads) {
      if ((prog[pc] as { test: CharTest }).test(c) && add(following, pc + 1, pos + 1)) return true;
    }
    [threads, following] = [following, []];
  }
};

const cache = new Map<string, BoundedRegex | null>();

/** The pattern as a BoundedRegex, or null when it is too long or the browser rejects it. Compiled patterns are kept
 *  (a Table tests one rule against every row). */
export const boundedRegex = (source: string, flags = ''): BoundedRegex | null => {
  const key = `${flags}/${source}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  let compiled: BoundedRegex | null = null;
  if (source.length <= MAX_PATTERN_LENGTH) {
    try {
      new RegExp(source, flags); // eslint-disable-line no-new
      let prog: Inst[] | null = null;
      try {
        prog = flags.includes('v') ? fail() : compile(parse(source, flags));
      } catch (e) {
        if (!(e instanceof Unsupported)) throw e;
      }
      compiled = {
        source,
        flags,
        supported: !!prog,
        test: (text: unknown) => {
          const s = String(text ?? '');
          return !!prog && s.length <= MAX_TEXT_LENGTH && s.length * prog.length <= MAX_WORK && run(prog, s, flags);
        },
      };
    } catch {
      compiled = null;
    }
  }
  const oldest = cache.keys().next().value;
  if (cache.size >= 200 && oldest !== undefined) cache.delete(oldest);
  cache.set(key, compiled);
  return compiled;
};
