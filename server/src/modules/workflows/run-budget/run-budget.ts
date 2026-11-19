import { WORKFLOW_LIMIT_ENV_VARS, WorkflowLimits } from '@modules/workflows/limits/workflow-limits';

type RunLimits = WorkflowLimits['run'];

/** The caps a run tree is held to; each maps to a `run.*` limit and its env override. */
type BudgetLimit =
  | 'maxNodes'
  | 'maxDepth'
  | 'maxChildren'
  | 'maxLoopIterations'
  | 'maxFilterItems'
  | 'maxNodeResultBytes'
  | 'maxStateBytes';

const DESCRIBE: Record<BudgetLimit, (max: number) => string> = {
  maxNodes: (max) => `${max} nodes executed`,
  maxDepth: (max) => `${max} levels of child workflows`,
  maxChildren: (max) => `${max} child workflow runs`,
  maxLoopIterations: (max) => `${max} loop iterations per node`,
  maxFilterItems: (max) => `${max} items per filter node`,
  maxNodeResultBytes: (max) => `${max} bytes per node result`,
  maxStateBytes: (max) => `${max} bytes of run state`,
};

/** A run hit one of its budget caps; the run fails with this message (decision D37). */
export class RunBudgetExceededError extends Error {
  constructor(
    readonly limit: BudgetLimit,
    readonly max: number
  ) {
    super(
      `This run stopped: it exceeded the limit of ${DESCRIBE[limit](max)} (${WORKFLOW_LIMIT_ENV_VARS[`run.${limit}`]})`
    );
    this.name = 'RunBudgetExceededError';
  }
}

/** Counters every run of one tree (a root run and its child runs) draws from. */
interface TreeCounters {
  nodes: number;
  children: number;
}

export type LogVerdict = 'keep' | 'cap' | 'drop';

/*
 * Bounds a run's log (decision D37: the log truncates, the run goes on). Entries are kept until
 * the entry or byte cap; the caller then writes one "log limit reached" entry ('cap') and drops
 * everything after it.
 */
export class LogGate {
  private entries = 0;
  private bytes = 0;
  private capped = false;

  constructor(
    private readonly maxEntries: number,
    private readonly maxBytes: number
  ) {}

  admit(entry: unknown): LogVerdict {
    if (this.capped) return 'drop';
    const size = byteLength(entry);
    if (this.entries + 1 >= this.maxEntries || this.bytes + size > this.maxBytes) {
      this.capped = true;
      return 'cap';
    }
    this.entries++;
    this.bytes += size;
    return 'keep';
  }
}

/*
 * The budget of one run tree (Phase 3): a root run and every child run it starts, at any depth,
 * share the node and child-run counters; depth is per run. Lives in memory for one run segment,
 * like the run timeout (a resumed run starts a new segment, D39). Every check throws
 * RunBudgetExceededError, which the engine turns into a failed run.
 */
export class RunBudget {
  private constructor(
    private readonly limits: RunLimits,
    readonly rootExecutionId: string,
    readonly depth: number,
    private readonly tree: TreeCounters
  ) {}

  static forRoot(limits: RunLimits, rootExecutionId: string): RunBudget {
    return new RunBudget(limits, rootExecutionId, 0, { nodes: 0, children: 0 });
  }

  /** The budget a child run starts with: one level deeper, same counters, same root. */
  startChild(): RunBudget {
    this.cap('maxDepth', this.depth + 1);
    this.cap('maxChildren', this.tree.children + 1);
    this.tree.children++;
    return new RunBudget(this.limits, this.rootExecutionId, this.depth + 1, this.tree);
  }

  /** Called once per node about to execute, anywhere in the tree. */
  chargeNode(): void {
    this.cap('maxNodes', this.tree.nodes + 1);
    this.tree.nodes++;
  }

  checkLoopIterations(count: number): void {
    this.cap('maxLoopIterations', count);
  }

  checkFilterItems(count: number): void {
    this.cap('maxFilterItems', count);
  }

  /** A node's input state: each earlier node's result, and the whole of it, must fit. */
  checkState(state: Record<string, unknown>): void {
    let total = 0;
    for (const value of Object.values(state ?? {})) {
      const size = byteLength(value);
      this.cap('maxNodeResultBytes', size);
      total += size;
    }
    this.cap('maxStateBytes', total);
  }

  logGate(): LogGate {
    return new LogGate(this.limits.maxLogEntries, this.limits.maxLogBytes);
  }

  private cap(limit: BudgetLimit, value: number): void {
    if (value > this.limits[limit]) throw new RunBudgetExceededError(limit, this.limits[limit]);
  }
}

function byteLength(value: unknown): number {
  if (value === undefined) return 0;
  try {
    return Buffer.byteLength(typeof value === 'string' ? value : (JSON.stringify(value) ?? ''));
  } catch {
    return 0; // Not serialisable (e.g. a function from the setup script): not stored either
  }
}
