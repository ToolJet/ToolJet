// Runs code search in a Web Worker (codeSearch.worker.js): indexing a large app and matching every
// field would otherwise block the editor, and a user's regex with catastrophic backtracking
// (`(a+)+$`) would freeze it — a running RegExp can't be interrupted, only its worker terminated.

import { createCodeSearchWorker } from './createCodeSearchWorker';
import {
  createSearcher,
  searchRecords,
  type SearchInputDefinition,
  type SearchRequest,
  type SearchResult,
} from './searchRecords';

export type SearchOutcome = { result: SearchResult } | { timedOut: true } | { superseded: true };

interface PendingSearch {
  id: number;
  regex: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  resolve: (outcome: SearchOutcome) => void;
  request: SearchRequest;
}

export const REGEX_TIMEOUT_MS = 2000;

let worker: Worker | null = null;
let postedInput: SearchInputDefinition | undefined; // the definition this worker instance has indexed
let pending: PendingSearch | null = null; // { id, regex, timer, resolve, request } of the search the worker is running
let nextId = 0;
// Main-thread fallback when workers can't start or the worker fails: same searcher, same results.
let workerFailed = false;
let mainThreadSearch: ReturnType<typeof createSearcher> | null = null;
let mainThreadInput: SearchInputDefinition | undefined;

const stop = () => {
  worker?.terminate();
  worker = null;
  postedInput = undefined;
};

const settle = (outcome: SearchOutcome) => {
  if (!pending) return;
  if (pending.timer) clearTimeout(pending.timer);
  const { resolve } = pending;
  pending = null;
  resolve(outcome);
};

const REGEX_NEEDS_WORKER = "Regular expression search isn't available in this browser";

// A user's regex can backtrack for seconds and can't be interrupted, so it never runs here.
const searchOnMainThread = ({ input, ...request }: SearchRequest): SearchOutcome => {
  if (request.filters?.regex) return { result: { ...searchRecords([], ''), error: REGEX_NEEDS_WORKER } };
  mainThreadSearch ||= createSearcher();
  const changed = input !== mainThreadInput;
  mainThreadInput = input;
  return {
    result: mainThreadSearch({
      ...request,
      input: changed ? input : undefined,
    }),
  };
};

const giveUpOnWorker = () => {
  workerFailed = true;
  stop();
};

// `input` is the app definition (see CodeSearch.jsx); it is posted only when it changed since the
// worker last indexed it. Resolves `{ result }`, `{ timedOut: true }` when a regex ran past the
// timeout, or `{ superseded: true }` when a newer search replaced this one.
export const runSearch = (request: SearchRequest): Promise<SearchOutcome> =>
  new Promise((resolve) => {
    if (pending) {
      const mayBeStuck = pending.regex;
      settle({ superseded: true });
      // A literal search finishes, so its stale reply is just dropped; a regex may never finish.
      if (mayBeStuck) stop();
    }
    if (!workerFailed && !worker) worker = createCodeSearchWorker();
    if (!worker) return resolve(searchOnMainThread(request));

    const { input, ...search } = request;
    const id = ++nextId;
    try {
      worker.postMessage({
        id,
        ...search,
        ...(input !== postedInput && { input }),
      });
    } catch {
      // DataCloneError: something in the definition can't be posted.
      giveUpOnWorker();
      return resolve(searchOnMainThread(request));
    }
    postedInput = input;

    const regex = Boolean(search.filters?.regex);
    const timer = regex
      ? setTimeout(() => {
          settle({ timedOut: true });
          stop();
        }, REGEX_TIMEOUT_MS)
      : null;
    pending = { id, regex, timer, resolve, request };
    worker.onmessage = ({ data }) => {
      if (data.id === pending?.id) settle({ result: data.result });
    };
    // The worker failed to load or threw: finish this search here and stay on the main thread.
    worker.onerror = (event) => {
      event.preventDefault();
      giveUpOnWorker();
      if (pending) settle(searchOnMainThread(pending.request));
    };
  });

// Called when the panel closes: frees the worker and its copy of the app.
export const disposeSearchWorker = () => {
  settle({ superseded: true });
  stop();
  mainThreadSearch = null;
  mainThreadInput = undefined;
};
