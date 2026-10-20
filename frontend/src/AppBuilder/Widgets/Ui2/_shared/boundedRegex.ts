// ToolJet UI 2.0: author-supplied regular expressions (a Tags pattern, Table regex filters and conditional-style
// rules) matched with bounded work. The browser's RegExp backtracks: a pattern like ^(a+)+$ takes seconds on 30
// characters, and once a match starts it cannot be stopped. So the browser's RegExp never runs a pattern on the text;
// the pack's own matchers (regex/) do, and every run is bounded:
// - The browser's own parser checks the pattern first, so a pattern it rejects is rejected here too (null).
// - Most patterns run on a linear-time engine (regex/linear.ts): the work is at most the text length times the
//   program's size. The pattern (MAX_PATTERN_LENGTH characters, MAX_PROGRAM steps once {n,m} repeats are written out),
//   the text (MAX_TEXT_LENGTH characters) and the work (text length times program steps, MAX_WORK) are capped.
// - Lookaround, backreferences and repeats too large to write out run on a backtracking matcher (regex/backtrack.ts)
//   that follows JavaScript's semantics, on text of at most MAX_FALLBACK_TEXT_LENGTH characters, for at most MAX_STEPS
//   steps (a few milliseconds) and MAX_DEPTH nested calls.
// - Single characters are tested by the browser's RegExp built for that one atom (regex/chars.ts), so case equivalence
//   (ς and σ), word characters under i and u (ſ, the Kelvin sign) and Unicode properties are JavaScript's own.
// A text past a cap, or a search out of steps, is TOO_COMPLEX; the v flag's classes of strings (\q{...},
// \p{RGI_Emoji}) are UNSUPPORTED. Neither is a match or a non-match: the caller decides (Tags refuses the tag, a Table
// rule holds for no row and the Table warns once).
import { compileBacktracking, Exhausted } from './regex/backtrack';
import type { Backtracker } from './regex/backtrack';
import { compileLinear, runLinear } from './regex/linear';
import { parse } from './regex/parse';
import type { Codes, Parsed } from './regex/parse';

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
