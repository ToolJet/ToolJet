// ToolJet UI 2.0: the linear-time matcher, a Thompson NFA stepped through the text one character at a time (as RE2
// does), so the work is at most the text length times the program's size, whatever the pattern. It runs the patterns
// with no lookaround and no backreferences whose {n,m} repeats, written out, fit in maxProgram steps; whether a match
// exists does not depend on greedy or lazy repeats, so these give JavaScript's answer.
import type { CharTest } from './chars';
import type { Codes, Node } from './parse';

type Inst =
  | { op: 'char'; test: CharTest }
  | { op: 'assert'; holds: (codes: Codes, pos: number) => boolean }
  | { op: 'split'; x: number; y: number }
  | { op: 'jmp'; x: number }
  | { op: 'match' };

export type Program = Inst[];

class TooLarge extends Error {}
const tooLarge = (): never => {
  throw new TooLarge();
};

/** The tree as a program of at most maxProgram steps, or null when it needs the backtracking matcher. */
export const compileLinear = (root: Node, maxProgram: number): Program | null => {
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
export const runLinear = (prog: Program, codes: Codes): boolean => {
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
