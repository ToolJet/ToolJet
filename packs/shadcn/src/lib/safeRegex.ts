// Author-supplied regular expressions (a TagsInput pattern, DataTable regex filters, conditional styles and button
// rules) matched with bounded work. Ported from UI 2.0 (_shared/boundedRegex.ts and _shared/regex/*), kept in one
// file so the pack carries no copy of the host's tree. The browser's RegExp backtracks: a pattern like ^(a+)+$ takes
// seconds on 33 characters, and once a match starts on the UI thread nothing can stop it, so length caps alone do not
// help. The browser's RegExp therefore never runs a pattern on the text; the matchers below do, and every run is
// bounded:
// - The browser's own parser checks the pattern first, so a pattern it rejects is rejected here too (null).
// - Most patterns run on a linear-time engine (a Thompson NFA): the work is at most the text length times the
//   program's size. The pattern (MAX_PATTERN_LENGTH characters, MAX_PROGRAM steps once {n,m} repeats are written out),
//   the text (MAX_TEXT_LENGTH characters) and the work (text length times program steps, MAX_WORK) are capped.
// - Lookaround, backreferences and repeats too large to write out run on a backtracking matcher that follows
//   JavaScript's semantics, on text of at most MAX_FALLBACK_TEXT_LENGTH characters, for at most MAX_STEPS steps (a few
//   milliseconds) and MAX_DEPTH nested calls.
// - Single characters are tested by the browser's RegExp built for that one atom, so case equivalence (ς and σ), word
//   characters under i and u (ſ, the Kelvin sign) and Unicode properties are JavaScript's own.
// A text past a cap, or a search out of steps, is TOO_COMPLEX; the v flag's classes of strings (\q{...},
// \p{RGI_Emoji}) are UNSUPPORTED. Neither is a match or a non-match: the caller decides (TagsInput refuses the tag, a
// DataTable rule holds for no cell and the table warns once).

// ---- Single characters -------------------------------------------------------------------------------------------
// What one character of an author's pattern matches, with JavaScript's exact semantics. Each atom (a literal under
// the i flag, a class, \w, \p{L}, a word boundary's word characters) is asked of the browser's own RegExp, built for
// that atom alone with the pattern's i, u and v flags and tested on one character at a time: one character cannot make
// a RegExp backtrack. Answers are remembered per atom, so a long text asks each character once.

/** Whether a character (a code unit, or a code point with the u or v flag) matches. */
type CharTest = (c: number) => boolean;

const isLineEnd = (c: number) => c === 10 || c === 13 || c === 0x2028 || c === 0x2029;
const anyChar: CharTest = () => true;
const notLineEnd: CharTest = (c) => !isLineEnd(c);

const MEMO_LIMIT = 4096;
const CACHE_LIMIT = 2000;

// An atom's RegExp as a CharTest, its answers kept: ASCII in a table, the rest in a map of at most MEMO_LIMIT.
const remembered = (re: RegExp): CharTest => {
  const ascii = new Uint8Array(128); // 0 not asked yet, 1 no, 2 yes
  const other = new Map<number, boolean>();
  return (c) => {
    if (c < 128) {
      const known = ascii[c];
      if (known) return known === 2;
      const yes = re.test(String.fromCharCode(c));
      ascii[c] = yes ? 2 : 1;
      return yes;
    }
    const known = other.get(c);
    if (known !== undefined) return known;
    const yes = re.test(String.fromCodePoint(c));
    if (other.size < MEMO_LIMIT) other.set(c, yes);
    return yes;
  };
};

const atoms = new Map<string, CharTest>();

/** The atom's source as written in the pattern (a class, an escape) tested on one character with flags (some of i,
 *  u and v). Throws when the browser rejects the atom on its own. */
const nativeChar = (atom: string, flags: string): CharTest => {
  const key = `${flags}/${atom}`;
  const known = atoms.get(key);
  if (known) return known;
  const test = remembered(new RegExp(`^(?:${atom})$`, flags));
  if (atoms.size >= CACHE_LIMIT) atoms.clear();
  atoms.set(key, test);
  return test;
};

const hex = (c: number, width: number) => c.toString(16).padStart(width, '0');

/** One character, matched as the pattern's flags match it: exactly, or with JavaScript's case equivalence under i. */
const literalChar = (code: number, flags: string): CharTest => {
  if (!flags.includes('i')) return (c) => c === code;
  const unicode = flags.includes('u') || flags.includes('v');
  return nativeChar(unicode ? `\\u{${hex(code, 1)}}` : `\\u${hex(code, 4)}`, flags);
};

/** The characters \b and \B count as word characters under these flags (with i and u, ſ and the Kelvin sign too). */
const wordChar = (flags: string): CharTest => nativeChar('\\w', flags);

// ---- Parsing ------------------------------------------------------------------------------------------------------
// An author's pattern read into a tree both matchers run. The browser has already accepted the pattern (boundedRegex
// checks it first), so this reads valid ECMAScript syntax, web-compatibility forms included (a literal {, \8, legacy
// octal escapes, a quantified lookahead). Single characters are left to the browser (above); the structure (groups,
// alternatives, repeats, lookaround, backreferences, assertions) is read here. A construct read differently would
// change answers, so anything not understood throws.

/** Text as the matchers read it: code units, or code points with the u or v flag. */
type Codes = ArrayLike<number>;

type Node =
  | { k: 'char'; test: CharTest }
  | { k: 'assert'; holds: (codes: Codes, pos: number) => boolean }
  | { k: 'seq'; items: Node[] }
  | { k: 'alt'; options: Node[] }
  | { k: 'group'; index: number; node: Node }
  // first and count: the capture groups inside, reset when the node starts again.
  | { k: 'look'; behind: boolean; negate: boolean; node: Node; first: number; count: number }
  | { k: 'backref'; groups: number[]; same: (a: number, b: number) => boolean }
  | { k: 'rep'; node: Node; min: number; max: number; greedy: boolean; first: number; count: number };

interface Parsed {
  root: Node;
  /** The number of capture groups. */
  groups: number;
  /** Whether text is read by code point (the u or v flag). */
  unicode: boolean;
}

/** Thrown for a construct the matchers do not run: the pattern's result is then 'unsupported', never a guess. */
class Unsupported extends Error {}
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

const parse = (src: string, flags: string): Parsed => {
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

// ---- Linear-time matcher -----------------------------------------------------------------------------------------
// The linear-time matcher, a Thompson NFA stepped through the text one character at a time (as RE2
// does), so the work is at most the text length times the program's size, whatever the pattern. It runs the patterns
// with no lookaround and no backreferences whose {n,m} repeats, written out, fit in maxProgram steps; whether a match
// exists does not depend on greedy or lazy repeats, so these give JavaScript's answer.

type Inst =
  | { op: 'char'; test: CharTest }
  | { op: 'assert'; holds: (codes: Codes, pos: number) => boolean }
  | { op: 'split'; x: number; y: number }
  | { op: 'jmp'; x: number }
  | { op: 'match' };

type Program = Inst[];

class TooLarge extends Error {}
const tooLarge = (): never => {
  throw new TooLarge();
};

/** The tree as a program of at most maxProgram steps, or null when it needs the backtracking matcher. */
const compileLinear = (root: Node, maxProgram: number): Program | null => {
  const prog: Inst[] = [];
  const emit = (inst: Inst) => {
    if (prog.length >= maxProgram) tooLarge();
    return prog.push(inst) - 1;
  };
  const split = () => emit({ op: 'split', x: 0, y: 0 }) as number;
  const at = (pc: number) => prog[pc] as { x: number; y: number };
  const gen = (n: Node): void => {
    if (n.k === 'char') emit({ op: 'char', test: n.test });
    else if (n.k === 'assert') emit({ op: 'assert', holds: n.holds });
    else if (n.k === 'seq') n.items.forEach(gen);
    else if (n.k === 'group') gen(n.node);
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
    } else if (n.k === 'rep') {
      if (n.min > maxProgram || (n.max !== Infinity && n.max > maxProgram)) tooLarge();
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
    } else tooLarge(); // lookaround and backreferences
  };
  try {
    gen(root);
    emit({ op: 'match' });
  } catch (e) {
    if (e instanceof TooLarge) return null;
    throw e;
  }
  return prog;
};

/** Whether the program matches anywhere in the text. Steps every live thread through the text together: each
 *  instruction is visited at most once per position. */
const runLinear = (prog: Program, codes: Codes): boolean => {
  const n = codes.length;
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
      else if (inst.holds(codes, pos)) stack.push(pc + 1);
    }
    return false;
  };
  let threads: number[] = [];
  let following: number[] = [];
  for (let pos = 0; ; pos += 1) {
    if (add(threads, 0, pos)) return true;
    if (pos === n) return false;
    if (!threads.length) continue;
    const c = codes[pos];
    for (const pc of threads) {
      if ((prog[pc] as { test: CharTest }).test(c) && add(following, pc + 1, pos + 1)) return true;
    }
    [threads, following] = [following, []];
  }
};

// ---- Backtracking matcher -----------------------------------------------------------------------------------------
// The backtracking matcher, for what the linear one cannot run: lookahead and lookbehind, negative or
// not, numbered and named backreferences, and repeats too large to write out. It follows the ECMAScript pattern
// semantics (22.2.2): each part is a matcher given a position and a continuation, greedy repeats try one more
// iteration before the continuation and lazy ones after, an iteration clears the captures inside it, an iteration that
// matches empty when no more are required fails (the empty check), lookaround is atomic and keeps the captures of a
// positive match, and lookbehind matches its contents right to left. Captures live in one array, set by a group as
// its continuation runs and restored when that fails, so a matcher that fails leaves them as it found them.
//
// Every matcher call and capture continuation is a step, and so is every character a backreference compares. Past the
// step budget, or past maxDepth nested calls, the test stops with 'too-complex' instead of running on.

type Cont = (pos: number) => boolean;
type Matcher = (pos: number, k: Cont) => boolean;

/** Thrown when a test runs out of steps or depth. */
class Exhausted extends Error {}

/** A test of the whole text: true or false, or throws Exhausted. */
type Backtracker = (codes: Codes) => boolean;

const compileBacktracking = ({ root, groups }: Parsed, budget: number, maxDepth: number): Backtracker => {
  let codes: Codes = [];
  let steps = 0;
  let depth = 0;
  // A capture group's start at 2g and end at 2g + 1; -1 while it has not matched.
  const caps = new Int32Array(2 * (groups + 1));
  const exhausted = new Exhausted();
  const spend = () => {
    steps += 1;
    depth += 1;
    if (steps > budget || depth > maxDepth) throw exhausted;
  };
  // Returns from a step: one call less deep.
  const done = (result: boolean) => {
    depth -= 1;
    return result;
  };
  const saveCaps = (first: number, count: number) => (count ? caps.slice(2 * first, 2 * (first + count)) : null);
  const restoreCaps = (first: number, saved: Int32Array | null) => saved && caps.set(saved, 2 * first);
  const accept: Cont = () => true;

  const compile = (node: Node, forward: boolean): Matcher => {
    switch (node.k) {
      case 'char': {
        const { test } = node;
        return forward
          ? (x, k) => (spend(), done(x < codes.length && test(codes[x]) && k(x + 1)))
          : (x, k) => (spend(), done(x > 0 && test(codes[x - 1]) && k(x - 1)));
      }
      case 'assert': {
        const { holds } = node;
        return (x, k) => (spend(), done(holds(codes, x) && k(x)));
      }
      case 'seq': {
        // Right to left inside a lookbehind: the last item matches first.
        const items = node.items.map((item) => compile(item, forward));
        if (!forward) items.reverse();
        if (!items.length) return (x, k) => (spend(), done(k(x)));
        return items.reduceRight((rest, m) => (x, k) => m(x, (y) => rest(y, k)));
      }
      case 'alt': {
        const options = node.options.map((option) => compile(option, forward));
        return (x, k) => {
          spend();
          for (const m of options) if (m(x, k)) return done(true);
          return done(false);
        };
      }
      case 'group': {
        const m = compile(node.node, forward);
        const at = 2 * node.index;
        return (x, k) => {
          spend();
          return done(
            m(x, (y) => {
              spend();
              const [start, end] = [caps[at], caps[at + 1]];
              caps[at] = forward ? x : y;
              caps[at + 1] = forward ? y : x;
              if (k(y)) return done(true);
              caps[at] = start;
              caps[at + 1] = end;
              return done(false);
            })
          );
        };
      }
      case 'look': {
        const m = compile(node.node, !node.behind);
        const { negate, first, count } = node;
        return (x, k) => {
          spend();
          const saved = saveCaps(first, count);
          const found = m(x, accept);
          if (negate) {
            // A negative lookaround's captures never escape it.
            if (found) restoreCaps(first, saved);
            return done(!found && k(x));
          }
          if (!found) return done(false);
          if (k(x)) return done(true);
          restoreCaps(first, saved);
          return done(false);
        };
      }
      case 'backref': {
        const { groups: refs, same } = node;
        return (x, k) => {
          spend();
          // A name used by more than one group refers to the one that matched.
          const g = refs.find((r) => caps[2 * r] >= 0);
          if (g === undefined) return done(k(x));
          const start = caps[2 * g];
          const length = caps[2 * g + 1] - start;
          const from = forward ? x : x - length;
          if (from < 0 || from + length > codes.length) return done(false);
          steps += length;
          if (steps > budget) throw exhausted;
          for (let j = 0; j < length; j += 1) if (!same(codes[start + j], codes[from + j])) return done(false);
          return done(k(forward ? x + length : from));
        };
      }
      case 'rep': {
        const m = compile(node.node, forward);
        const { greedy, first, count } = node;
        // RepeatMatcher: min iterations still required, max still allowed.
        const repeat = (x: number, k: Cont, min: number, max: number): boolean => {
          spend();
          if (max === 0) return done(k(x));
          const d: Cont = (y) => (min === 0 && y === x ? false : repeat(y, k, min === 0 ? 0 : min - 1, max - 1));
          const iterate = () => {
            const saved = saveCaps(first, count);
            if (count) caps.fill(-1, 2 * first, 2 * (first + count));
            if (m(x, d)) return true;
            restoreCaps(first, saved);
            return false;
          };
          if (min !== 0) return done(iterate());
          return done(greedy ? iterate() || k(x) : k(x) || iterate());
        };
        return (x, k) => repeat(x, k, node.min, node.max);
      }
      default:
        throw new Error('Unknown node');
    }
  };

  const matcher = compile(root, true);
  return (input) => {
    codes = input;
    steps = 0;
    caps.fill(-1);
    try {
      for (let start = 0; start <= input.length; start += 1) {
        depth = 0;
        if (matcher(start, accept)) return true;
      }
      return false;
    } catch (e) {
      // A stack overflow before maxDepth (a deeply nested pattern) is the same outcome.
      const overflow = e instanceof RangeError || (e as Error)?.name === 'InternalError'; // Firefox's
      if (e instanceof Exhausted || overflow) throw exhausted;
      throw e;
    }
  };
};

// ---- Bounded patterns ---------------------------------------------------------------------------------------------
export const MAX_PATTERN_LENGTH = 2000;
export const MAX_PROGRAM = 2000;
export const MAX_TEXT_LENGTH = 10_000;
export const MAX_WORK = 1_000_000;
export const MAX_FALLBACK_TEXT_LENGTH = 256;
export const MAX_STEPS = 100_000;
export const MAX_DEPTH = 1500;

export const TOO_COMPLEX = 'too-complex';
export const UNSUPPORTED = 'unsupported';
/** A test's answer: whether the text matches, or why that could not be told within the bounds. */
export type RegexOutcome = boolean | typeof TOO_COMPLEX | typeof UNSUPPORTED;

/** A pattern ready to test text against, like a RegExp's test (g, y and d are ignored: no lastIndex is kept). */
export interface BoundedRegex {
  readonly source: string;
  readonly flags: string;
  /** Whether the linear-time engine runs it (no lookaround, no backreferences, a program of at most MAX_PROGRAM). */
  readonly linear: boolean;
  /** Whether the text matches, or TOO_COMPLEX / UNSUPPORTED. */
  match(text: unknown): RegexOutcome;
  /** match() as a boolean: true only for a match, so TOO_COMPLEX and UNSUPPORTED read as no match. */
  test(text: unknown): boolean;
}

// Text as the matchers read it: code units, or code points with the u or v flag.
const toCodes = (s: string, unicode: boolean): Codes => {
  if (unicode) return Array.from(s, (ch) => ch.codePointAt(0) ?? 0);
  const codes = new Uint16Array(s.length);
  for (let i = 0; i < s.length; i += 1) codes[i] = s.charCodeAt(i);
  return codes;
};

const backtracking = (run: Backtracker, unicode: boolean) => (s: string) => {
  if (s.length > MAX_FALLBACK_TEXT_LENGTH) return TOO_COMPLEX;
  try {
    return run(toCodes(s, unicode));
  } catch (e) {
    if (e instanceof Exhausted) return TOO_COMPLEX;
    throw e;
  }
};

// The matcher for a pattern the browser accepts (flags: those that change what matches).
const matcherFor = (source: string, flags: string): { linear: boolean; match: (s: string) => RegexOutcome } => {
  let parsed: Parsed;
  try {
    parsed = parse(source, flags);
  } catch {
    return { linear: false, match: () => UNSUPPORTED };
  }
  const { unicode } = parsed;
  const prog = compileLinear(parsed.root, MAX_PROGRAM);
  if (!prog) return { linear: false, match: backtracking(compileBacktracking(parsed, MAX_STEPS, MAX_DEPTH), unicode) };
  return {
    linear: true,
    match: (s) =>
      s.length > MAX_TEXT_LENGTH || s.length * prog.length > MAX_WORK
        ? TOO_COMPLEX
        : runLinear(prog, toCodes(s, unicode)),
  };
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
      const { linear, match } = matcherFor(source, flags.replace(/[gyd]/g, ''));
      const outcome = (text: unknown) => match(String(text ?? ''));
      compiled = { source, flags, linear, match: outcome, test: (text) => outcome(text) === true };
    } catch {
      compiled = null;
    }
  }
  const oldest = cache.keys().next().value;
  if (cache.size >= 200 && oldest !== undefined) cache.delete(oldest);
  cache.set(key, compiled);
  return compiled;
};

const warned = new Set<string>();

/** Logs, once per pattern, that a widget could not check its pattern on some value (TOO_COMPLEX or UNSUPPORTED), and
 *  what the widget did about it (`result`). */
export const warnRegexOutcome = (widget: string, re: BoundedRegex, outcome: RegexOutcome, result: string) => {
  if (typeof outcome === 'boolean' || warned.has(re.source)) return;
  if (warned.size >= 100) warned.clear();
  warned.add(re.source);
  const shown = re.source.length > 120 ? `${re.source.slice(0, 120)}...` : re.source;
  const why =
    outcome === TOO_COMPLEX
      ? 'is too complex to check on some values within its work limit'
      : 'uses syntax that cannot be checked (a class of strings)';
  console.warn(`${widget}: the pattern /${shown}/ ${why}, ${result}.`);
};
