/**
 * Per-frame batching of main→worker shadow commands (Phase 5).
 *
 * Commands are queued synchronously (cheap — no worker call yet) and flushed
 * once per animation frame, sequentially awaited against the worker so each
 * command's returned updates can be matched back to its own comparison call
 * without extra bookkeeping.
 *
 * Ordering note: this codebase's cascades are already serial on the calling
 * side (JS run-to-completion — no two cascades interleave on the main
 * thread), and Comlink's underlying MessageChannel is FIFO with a
 * single-threaded worker on the other end, so sequential awaiting here isn't
 * fixing a real race — it's just the simplest way to keep each command's
 * result attributable to itself.
 *
 * Deliberately generic over the command shape (WorkerShadowCommand) with the
 * actual dispatch logic registered by workerEngineBridge.ts via
 * setWorkerCommandHandler — keeps this file free of any dependency on
 * workerEngineBridge.ts, avoiding a module cycle.
 */
import type { RowScopedEngineSeed } from './rowScopedShadow';

export interface WorkerShadowCommand {
  moduleId: string;
  path: string;
  rowScopedSeed: RowScopedEngineSeed;
  rowScoped: { componentId: string; wholeArray: unknown } | null;
  value: unknown;
  /** Monotonic, assigned by enqueueWorkerCommand — lets a late-arriving
   *  worker answer be checked against isSourcePathStale before it's used to
   *  drive anything (Phase 6 Stage 1 write-behind). */
  seq: number;
}

type CommandHandler = (cmd: WorkerShadowCommand, isLastForModuleInBatch: boolean) => Promise<void>;

let handler: CommandHandler | null = null;
let queue: WorkerShadowCommand[] = [];
let flushScheduled = false;

let nextSeq = 0;
/** `${moduleId}|${path}` -> the seq of the most recently enqueued command for
 *  that trigger path. Scoped by TRIGGER path, not every affected/dependent
 *  path a cascade computes — coarser than a full per-affected-path
 *  generation ledger, but matches the actual race this guards against (two
 *  cascades on the same trigger racing over a worker round-trip) without
 *  instrumenting applyDependencyUpdate's hot-path write sites. */
const latestSeqBySourcePath = new Map<string, number>();

export function setWorkerCommandHandler(fn: CommandHandler): void {
  handler = fn;
}

export function enqueueWorkerCommand(cmd: Omit<WorkerShadowCommand, 'seq'>): number {
  const seq = ++nextSeq;
  latestSeqBySourcePath.set(`${cmd.moduleId}|${cmd.path}`, seq);
  queue.push({ ...cmd, seq });
  scheduleFlush();
  return seq;
}

/** True if a newer cascade for the same (moduleId, trigger path) has been
 *  enqueued since `seq` was captured — i.e. this command's worker answer,
 *  if applied now, would clobber a fresher value with a stale one. */
export function isSourcePathStale(moduleId: string, path: string, seq: number): boolean {
  const latest = latestSeqBySourcePath.get(`${moduleId}|${path}`);
  return latest !== undefined && latest > seq;
}

function scheduleFlush(): void {
  if (flushScheduled) return;
  flushScheduled = true;
  const schedule =
    typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn: () => void) => setTimeout(fn, 16);
  schedule(() => {
    void flush();
  });
}

async function flush(): Promise<void> {
  flushScheduled = false;
  const batch = queue;
  queue = [];
  if (!handler) return;

  // A single synchronous store cascade (e.g. a RunJS query touching a
  // 15000-row ListView) can enqueue many commands for the same module in one
  // burst, all landing in this one batch. The store settles to its FINAL
  // state synchronously, long before any of these commands reach the worker
  // — so comparing every one of them against the store's (already-final)
  // current state would flag all-but-the-last as false divergences purely
  // from lag, not real mismatches. Only the last command per module in this
  // batch is compared; earlier ones still update the worker engine's
  // cumulative state so it stays correct.
  const lastIndexForModule = new Map<string, number>();
  batch.forEach((cmd, i) => lastIndexForModule.set(cmd.moduleId, i));

  for (let i = 0; i < batch.length; i++) {
    const cmd = batch[i];
    await handler(cmd, lastIndexForModule.get(cmd.moduleId) === i);
  }
}
