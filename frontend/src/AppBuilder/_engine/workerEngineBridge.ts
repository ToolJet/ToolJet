/**
 * Worker-hosted engine bridge — Phase 5 continuous shadow mode.
 *
 * Async twin of engineBridge.ts's continuous-shadow half: the same
 * ResolutionEngine, hosted in a Web Worker instead of the main thread,
 * mirrored via a per-frame command batch (workerCommandBatcher.ts) instead
 * of a direct synchronous call. Diffs against the store using the same
 * shadowCompare.ts comparison used by the main-thread shadow.
 *
 * Row-scoped seeding/command-shape decisions are computed synchronously here
 * (same store reads engineBridge.ts's engineShadowOnCascade does) — only the
 * engine call itself crosses the worker boundary asynchronously.
 *
 * Cutover (resolveDependencyViaEngine) is NOT mirrored here — Phase 6 scope;
 * nothing reads this engine's output.
 *
 * Dev usage (browser console):
 *   window.__tjWorkerEngineShadowStart()
 *   window.__tjWorkerEngineShadowStats()   // { workerReady, cascades, compared, matches, divergences, skipped }
 *   window.__tjWorkerEngineShadowStop()
 */
import * as Comlink from 'comlink';
import useStore from '@/AppBuilder/_stores/store';
import { buildRowScopedEngineSeed, buildEngineInit, getComparableRowIndices } from './rowScopedShadow';
import { compareUpdatesToStore, type CompareSession } from './shadowCompare';
import {
  enqueueWorkerCommand,
  setWorkerCommandHandler,
  isSourcePathStale,
  type WorkerShadowCommand,
} from './workerCommandBatcher';
import { toCloneable } from './workerSanitize';
import { applyWorkerWriteBehind, isWorkerWriteBehindActive } from './workerWriteBehind';
import { maybeCreateQueryDataHandle } from '@/AppBuilder/_utils/queryDataHandle';
import { get as lodashGet } from 'lodash';
import type { WorkerEngineApi } from './engine.worker';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface WorkerShadowSession extends CompareSession {
  cascades: number;
  initializedModules: Set<string>;
  skipped: CompareSession['skipped'] & {
    querySentinels: number;
    structuralNoBinding: number;
    nonComponent: number;
    /** This command's own trigger path was superseded by a newer cascade
     *  before its worker round-trip resolved — comparing now would compare
     *  against store state that's already moved past what this answer
     *  reflects (lag, not a real mismatch). See isSourcePathStale. */
    stale: number;
  };
}

let session: WorkerShadowSession | null = null;
let worker: Worker | null = null;
let workerApi: Comlink.Remote<WorkerEngineApi> | null = null;
let workerReady = false;

export function isWorkerEngineShadowActive(): boolean {
  return session !== null;
}

function getWorkerApi(): Comlink.Remote<WorkerEngineApi> {
  if (!workerApi) {
    worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { name: 'ToolJetEngineWorker' });
    workerApi = Comlink.wrap<WorkerEngineApi>(worker);
    workerReady = false;
    // Comlink.wrap resolves immediately; readiness here just means "worker
    // script has been asked to boot" — good enough for the dev-stats flag,
    // since Comlink queues calls until the worker's message port is live.
    Promise.resolve().then(() => {
      workerReady = true;
    });
  }
  return workerApi;
}

async function getOrInitWorkerEngine(moduleId: string): Promise<boolean> {
  if (!session) return false;
  if (session.initializedModules.has(moduleId)) return true;
  const store = (useStore as any).getState();
  if (!store.dependencyGraph.modules[moduleId]?.graph) return false;
  await getWorkerApi().initEngine(moduleId, toCloneable(buildEngineInit(store, moduleId)));
  session.initializedModules.add(moduleId);
  return true;
}

/**
 * Tap for componentsSlice.updateDependencyValues, called next to the
 * existing engineShadowOnCascade. Computes the command descriptor
 * synchronously (row-scoped seed + array-vs-flat branching mirror the store
 * state at the moment of the cascade, same as the main-thread shadow) and
 * hands it to the per-frame batcher — the worker call itself happens later,
 * batched with other pending commands.
 */
export function workerEngineShadowOnCascade(path: string, moduleId: string): void {
  if (!session) return;
  session.cascades++;

  const store = (useStore as any).getState();
  const rowScopedSeed = buildRowScopedEngineSeed(store, moduleId);

  const triggerComponentId = path.startsWith('components.') ? path.split('.')[1] : undefined;
  const isTriggerRowScoped =
    triggerComponentId !== undefined && getComparableRowIndices(store, triggerComponentId, moduleId) !== null;

  enqueueWorkerCommand({
    moduleId,
    path,
    rowScopedSeed,
    rowScoped: isTriggerRowScoped
      ? { componentId: triggerComponentId as string, wholeArray: lodashGet(store.getAllExposedValues(moduleId), ['components', triggerComponentId]) }
      : null,
    value: isTriggerRowScoped
      ? undefined
      : maybeCreateQueryDataHandle(path, lodashGet(store.getAllExposedValues(moduleId), path)),
  });
}

async function dispatchWorkerCommand(cmd: WorkerShadowCommand, isLastForModuleInBatch: boolean): Promise<void> {
  if (!session) return;
  const ready = await getOrInitWorkerEngine(cmd.moduleId);
  if (!ready) return;
  const api = getWorkerApi();

  await api.updateRowScopedSeed(cmd.moduleId, toCloneable(cmd.rowScopedSeed));

  const result = cmd.rowScoped
    ? await api.syncRowScopedArrayAndCascade(
        cmd.moduleId,
        cmd.rowScoped.componentId,
        toCloneable(cmd.rowScoped.wholeArray),
        cmd.path
      )
    : (await api.applyCommands(cmd.moduleId, [{ kind: 'SET_RUNTIME', path: cmd.path, value: toCloneable(cmd.value) }]))
        ?.updates ?? null;

  if (!session || !result) return;

  // Only the last command per module in a flush batch is compared — a
  // synchronous store cascade can enqueue many commands for one module
  // before any of them reach the worker, and the store has already settled
  // to its final state by then (see workerCommandBatcher.ts). Comparing
  // every intermediate command against that already-final state would flag
  // lag as false divergences. Earlier commands still update the worker
  // engine's own cumulative state above — only the comparison is skipped.
  if (!isLastForModuleInBatch) return;

  // The batch-level "last per module" check above only rules out same-frame
  // races. A worker round-trip can take longer than one frame (e.g. a large
  // row-scoped reseed) — by the time THIS command's answer resolves, a
  // newer cascade on the SAME trigger path may have already landed and
  // moved the store past what this answer reflects. Comparing anyway
  // produces a false divergence (this answer is stale, not wrong).
  if (isSourcePathStale(cmd.moduleId, cmd.path, cmd.seq)) {
    session.skipped.stale++;
    return;
  }

  for (const affected of result) {
    if (affected.path.endsWith('.__options__')) session.skipped.querySentinels++;
    else if (!affected.path.startsWith('components.') && !affected.path.startsWith('others.'))
      session.skipped.nonComponent++;
  }

  const toCompare = result.filter(
    (u) =>
      u.path !== cmd.path &&
      (u.path.startsWith('components.') || u.path.startsWith('others.')) &&
      !u.path.endsWith('.__options__')
  );
  if (!toCompare.length) return;
  compareUpdatesToStore(toCompare, cmd.path, cmd.moduleId, session, 'worker');
  if (isWorkerWriteBehindActive()) applyWorkerWriteBehind(toCompare, cmd);
}

setWorkerCommandHandler(dispatchWorkerCommand);

export function startWorkerEngineShadow(): void {
  session = {
    cascades: 0,
    compared: 0,
    matches: 0,
    divergences: [],
    initializedModules: new Set(),
    skipped: { querySentinels: 0, rowScoped: 0, structuralNoBinding: 0, nonComponent: 0, rowUnresolvable: 0, stale: 0 },
  };
  getWorkerApi(); // boot eagerly so __tjWorkerEngineShadowStats() can report readiness promptly
}

export function stopWorkerEngineShadow(): WorkerShadowSession | null {
  const finished = session;
  session = null;
  return finished;
}

export function workerEngineShadowStats(): (Omit<WorkerShadowSession, 'initializedModules'> & { workerReady: boolean }) | null {
  if (!session) return null;
  const { cascades, compared, matches, divergences, skipped } = session;
  return { cascades, compared, matches, divergences, skipped, workerReady };
}

/** Graph structure changed: drop the worker's engine for this module so it
 *  lazily rebuilds from the live graph on the next cascade — mirrors
 *  engineBridge.ts's invalidateEngineMirrors. */
export function invalidateWorkerEngineMirrors(moduleId?: string): void {
  if (!workerApi) return;
  if (moduleId) {
    session?.initializedModules.delete(moduleId);
    void workerApi.invalidate(moduleId);
  } else {
    session?.initializedModules.clear();
    void workerApi.invalidate();
  }
}
