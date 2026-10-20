// ToolJet UI 2.0: the backtracking matcher, for what the linear one cannot run: lookahead and lookbehind, negative or
// not, numbered and named backreferences, and repeats too large to write out. It follows the ECMAScript pattern
// semantics (22.2.2): each part is a matcher given a position and a continuation, greedy repeats try one more
// iteration before the continuation and lazy ones after, an iteration clears the captures inside it, an iteration that
// matches empty when no more are required fails (the empty check), lookaround is atomic and keeps the captures of a
// positive match, and lookbehind matches its contents right to left. Captures live in one array, set by a group as
// its continuation runs and restored when that fails, so a matcher that fails leaves them as it found them.
//
// Every matcher call and capture continuation is a step, and so is every character a backreference compares. Past the
// step budget, or past maxDepth nested calls, the test stops with 'too-complex' instead of running on.
import type { Codes, Node, Parsed } from './parse';

type Cont = (pos: number) => boolean;
type Matcher = (pos: number, k: Cont) => boolean;

/** Thrown when a test runs out of steps or depth. */
export class Exhausted extends Error {}

/** A test of the whole text: true or false, or throws Exhausted. */
export type Backtracker = (codes: Codes) => boolean;

export const compileBacktracking = ({ root, groups }: Parsed, budget: number, maxDepth: number): Backtracker => {
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
