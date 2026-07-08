/**
 * RunJS-in-worker (opt-in MVP). Ports executeMultilineJS's AsyncFunction
 * construction verbatim — same param list, same error/line-number parsing —
 * so the result shape is identical to the main-thread path and nothing
 * downstream (processQueryResults/setResolvedQuery) needs to change.
 *
 * One worker instance per execution (see runjsWorkerBridge.ts) — not a
 * shared pool. Real hard-cancellation (worker.terminate()) is the actual
 * new capability here: today, aborting a RunJS query only cosmetically
 * clears the loading spinner while the script keeps running on main thread.
 *
 * actions.* / queries.*.run() etc. are NOT available synchronously here —
 * every call becomes a Comlink RPC round-trip to the main thread's real
 * implementation (see runjsWorkerBridge.ts's actionsApi/queriesApi). Known
 * compatibility break: actions.getVariable()/getPageVariable() return a raw
 * synchronous value on main thread today; through Comlink they return a
 * Promise, so a script reading the result WITHOUT `await` will get the
 * Promise object instead of the value. This is why worker execution is an
 * explicit, informed, per-query opt-in (query.options.runInWorker) — never
 * a default migration.
 *
 * NOT available in this worker (documented v1 limitations, not bugs):
 *   - JS libraries (jsLibraryRegistry) — function/class exports aren't
 *     structured-cloneable; re-loading them in-worker is future work.
 *   - window/document/any DOM API — scripts referencing these fail with a
 *     ReferenceError, caught below and surfaced as a normal query error,
 *     same as any other RunJS bug today (a loud failure, not a silent one).
 */
import * as Comlink from 'comlink';
import moment from 'moment';
import axios from 'axios';

/* eslint-disable @typescript-eslint/no-explicit-any */

// babel-plugin-import (configured for lodash in webpack.config.js) assumes
// every usage of a default-imported lodash object is a `_.method()` member
// access it can rewrite to a `lodash/method` import, and unconditionally
// strips the original `import ... from 'lodash'` statement on that
// assumption. This file only ever passes `_` through as a raw value into
// RunJS's execution scope (never accessed via member expression here), so
// the plugin drops the import anyway, leaving a bare unbound `_` reference
// — same root cause fixed in resolver.ts earlier this session. A plain
// require() isn't an `import` AST node, so the plugin's rewriter never
// touches it.
declare const require: (id: string) => any;
const _ = require('lodash');

export interface RunJsExecRequest {
  code: string;
  hasParameters: boolean;
  hasInput: boolean;
  scope: {
    components: unknown;
    queries: Record<string, unknown>;
    globals: unknown;
    page: unknown;
    variables: unknown;
    constants: unknown;
    parameters?: unknown;
    input?: unknown;
  };
  timeoutMs: number;
}

export interface RunJsExecResult {
  status: 'ok' | 'failed';
  data: unknown;
}

/** Local copy of _helpers/utils.js's hasCircularDependency — not imported
 *  wholesale, since that module has unrelated window-touching code
 *  (loadPyodide) that has no place in a worker bundle. */
function hasCircularDependency(obj: unknown, stack = new Set<unknown>()): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  if (stack.has(obj)) return true;
  stack.add(obj);
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (hasCircularDependency((obj as any)[key], new Set(stack))) return true;
    }
  }
  stack.delete(obj);
  return false;
}

function rejectAfter(ms: number): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(`RunJS execution timed out after ${ms}ms`)), ms);
  });
}

/**
 * `actionsPort`/`queriesPort` are MessagePorts (from a MessageChannel created
 * main-thread-side) wrapped via Comlink into remote proxies — kept separate
 * from this worker's own exposed `execute` API so the two RPC directions
 * (main->worker command, worker->main action calls) don't share one
 * request/response channel.
 */
const api = {
  async execute(
    req: RunJsExecRequest,
    actionsPort: MessagePort,
    queriesPort: MessagePort
  ): Promise<RunJsExecResult> {
    const actionsRpc = Comlink.wrap<Record<string, (...args: unknown[]) => Promise<unknown>>>(actionsPort);
    const queriesRpcBase = Comlink.wrap<Record<string, (...args: unknown[]) => Promise<unknown>>>(queriesPort);

    // Rebuild the same per-query `{run,reset,abort,getData,getRawData,getloadingState}`
    // shape executeMultilineJS gives real scripts today — each method is a
    // thin RPC wrapper instead of a same-thread closure.
    const queries: Record<string, any> = {};
    for (const [name, snapshot] of Object.entries(req.scope.queries)) {
      queries[name] = {
        ...(snapshot as object),
        run: (params?: unknown, callbackFns?: unknown) => queriesRpcBase.run(name, params, callbackFns),
        reset: () => queriesRpcBase.reset(name),
        abort: () => queriesRpcBase.abort(name),
        getData: () => queriesRpcBase.getData(name),
        getRawData: () => queriesRpcBase.getRawData(name),
        getloadingState: () => queriesRpcBase.getloadingState(name),
      };
    }

    let result: RunJsExecResult;
    try {
      const AsyncFunction = new Function(`return Object.getPrototypeOf(async function(){}).constructor`)();
      const fnParams = [
        'moment',
        '_',
        'components',
        'queries',
        'globals',
        'page',
        'axios',
        'variables',
        'actions',
        'constants',
        ...(req.hasParameters ? ['parameters'] : []),
        ...(req.hasInput ? ['input'] : []),
        req.code,
      ];
      const evalFn = new AsyncFunction(...fnParams);

      const fnArgs = [
        moment,
        _,
        req.scope.components,
        queries,
        req.scope.globals,
        req.scope.page,
        axios,
        req.scope.variables,
        actionsRpc,
        req.scope.constants,
        ...(req.hasParameters ? [req.scope.parameters] : []),
        ...(req.hasInput ? [req.scope.input] : []),
      ];

      const data = await Promise.race([evalFn(...fnArgs), rejectAfter(req.timeoutMs)]);
      result = { status: 'ok', data };
    } catch (err: any) {
      const stackLines = (err?.stack ?? '').split('\n');
      const errorLocation =
        stackLines[2]?.match(/<anonymous>:(\d+):(\d+)/) ?? stackLines[1]?.match(/<anonymous>:(\d+):(\d+)/);
      const lineNumber = errorLocation ? Number(errorLocation[1]) - 2 : null;
      const message = err?.message || (err?.stack ?? '').split('\n')[0] || 'JS execution failed';
      result = { status: 'failed', data: { message, description: message, lineNumber } };
    }

    if (hasCircularDependency(result)) {
      return { status: 'failed', data: { message: 'Circular dependency detected', description: 'Cannot resolve circular dependency' } };
    }
    return result;
  },
};

export type RunJsWorkerApi = typeof api;

Comlink.expose(api);
