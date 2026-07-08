/**
 * RunJS-in-worker bridge (opt-in MVP) — main-thread side.
 *
 * For each worker-mode execution: spins up a fresh Worker (one per run, not
 * pooled — simplest to reason about, and makes worker.terminate() a clean,
 * blast-radius-free cancel for exactly one run), wires two MessageChannels
 * (one for `actions.*`, one for `queries.*` methods) so the worker's script
 * can call back into the REAL main-thread implementations
 * (generateAppActions / the live per-query run/reset/abort/getData methods)
 * via Comlink RPC, and registers the worker so abortQuery can hard-cancel it.
 *
 * Explicit, informed, per-query opt-in only (query.options.runInWorker) —
 * see runjs.worker.ts's header for the concrete compatibility break this
 * implies (actions.getVariable()/getPageVariable() become Promises).
 *
 * Dev usage (browser console):
 *   window.__tjRunJsWorkerEnable()    // force worker mode for ALL RunJS runs
 *   window.__tjRunJsWorkerDisable()
 */
import * as Comlink from 'comlink';
import { toCloneable } from '@/AppBuilder/_engine/workerSanitize';
import { maybeCreateQueryDataHandle } from '@/AppBuilder/_utils/queryDataHandle';
import type { RunJsExecRequest, RunJsExecResult, RunJsWorkerApi } from './runjs.worker';

/* eslint-disable @typescript-eslint/no-explicit-any */

let devForceEnabled = false;

export function isRunJsWorkerEnabled(): boolean {
  return devForceEnabled;
}

/** queryId -> live Worker for an in-flight worker-mode RunJS execution, so
 *  abortQuery can call .terminate() — a real hard-cancel, unlike the
 *  cosmetic-only abort RunJS has today. Kept outside Zustand, mirroring
 *  queryAbort.js's own rationale (a Worker instance isn't Immer-cloneable
 *  either). */
export const runjsWorkerControllers = new Map<string, Worker>();

export interface RunJsScopeInput {
  components: unknown;
  queriesInResolvedState: Record<string, any>;
  globals: unknown;
  page: unknown;
  variables: unknown;
  constants: unknown;
  parameters?: unknown;
  input?: unknown;
}

export interface ActionsRpcTarget {
  [method: string]: (...args: unknown[]) => unknown;
}

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Runs `code` for `queryId` inside a fresh worker. `actions` is the real
 * object generateAppActions() already builds (unchanged) — its methods get
 * exposed over a MessageChannel so the worker's RPC calls invoke them for
 * real. `queriesInResolvedState` is the same enriched per-query object
 * executeMultilineJS already builds today (run/reset/abort/getData/
 * getRawData/getloadingState closures) — same treatment.
 */
export async function runJsInWorker(
  queryId: string,
  code: string,
  scope: RunJsScopeInput,
  actions: ActionsRpcTarget,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<RunJsExecResult> {
  // Worker's `name` must be a literal string, not an interpolated one — webpack's
  // native worker support statically reads it to name the emitted chunk (see
  // engine.worker.ts's identical pattern); a dynamic name here would fall back to
  // an unnamed numbered chunk instead.
  const worker = new Worker(new URL('./runjs.worker.ts', import.meta.url), { name: 'RunJSWorker' });
  runjsWorkerControllers.set(queryId, worker);
  const workerApi = Comlink.wrap<RunJsWorkerApi>(worker);

  const actionsChannel = new MessageChannel();
  const queriesChannel = new MessageChannel();

  // Expose the REAL, unchanged actions object over one side of each
  // channel — every actions.* method already exists; Comlink just makes it
  // callable across the worker boundary. Same for the per-query methods.
  Comlink.expose(actions, actionsChannel.port1);

  const queriesApi: Record<string, (...args: any[]) => unknown> = {
    run: (name: string, params: unknown, callbackFns: unknown) => scope.queriesInResolvedState[name]?.run(params, callbackFns),
    reset: (name: string) => scope.queriesInResolvedState[name]?.reset(),
    abort: (name: string) => scope.queriesInResolvedState[name]?.abort(),
    getData: (name: string) => scope.queriesInResolvedState[name]?.getData(),
    getRawData: (name: string) => scope.queriesInResolvedState[name]?.getRawData(),
    getloadingState: (name: string) => scope.queriesInResolvedState[name]?.getloadingState(),
  };
  Comlink.expose(queriesApi, queriesChannel.port1);

  // Query snapshots for the worker: strip functions (toCloneable — some
  // exposed values are functions, e.g. widget setValue methods) and
  // substitute a lightweight handle for any large data/rawData array
  // (reusing Stage 2's queryDataHandle.ts — the per-query getData()/
  // getRawData() RPC methods above serve as the on-demand fallback).
  const queriesSnapshot: Record<string, unknown> = {};
  for (const [name, entry] of Object.entries(scope.queriesInResolvedState)) {
    const { run: _run, reset: _reset, abort: _abort, getData: _getData, getRawData: _getRawData, getloadingState: _getloadingState, ...data } =
      entry as Record<string, unknown>;
    queriesSnapshot[name] = {
      ...toCloneable(data),
      data: maybeCreateQueryDataHandle(`queries.${name}.data`, (data as any).data),
      rawData: maybeCreateQueryDataHandle(`queries.${name}.rawData`, (data as any).rawData),
    };
  }

  const req: RunJsExecRequest = {
    code,
    hasParameters: scope.parameters !== undefined,
    hasInput: scope.input !== undefined,
    scope: {
      components: toCloneable(scope.components),
      queries: queriesSnapshot,
      globals: toCloneable(scope.globals),
      page: toCloneable(scope.page),
      variables: toCloneable(scope.variables),
      constants: toCloneable(scope.constants),
      parameters: scope.parameters,
      input: scope.input,
    },
    timeoutMs,
  };

  try {
    return await workerApi.execute(
      req,
      Comlink.transfer(actionsChannel.port2, [actionsChannel.port2]),
      Comlink.transfer(queriesChannel.port2, [queriesChannel.port2])
    );
  } finally {
    runjsWorkerControllers.delete(queryId);
    worker.terminate();
  }
}

/** Hard-cancel a worker-mode RunJS run in progress. Returns true if a
 *  worker was actually found and terminated. */
export function terminateRunJsWorker(queryId: string): boolean {
  const worker = runjsWorkerControllers.get(queryId);
  if (!worker) return false;
  worker.terminate();
  runjsWorkerControllers.delete(queryId);
  return true;
}

declare const process: { env: { NODE_ENV?: string } };
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  (window as any).__tjRunJsWorkerEnable = () => {
    devForceEnabled = true;
    // eslint-disable-next-line no-console
    console.log(
      '[runjs-worker] forced on for all RunJS runs — note: actions.getVariable()/getPageVariable() become Promises under worker mode (see runjs.worker.ts header)'
    );
  };
  (window as any).__tjRunJsWorkerDisable = () => {
    devForceEnabled = false;
  };
}
