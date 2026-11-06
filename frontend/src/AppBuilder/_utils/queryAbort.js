// Runtime state for the "abort in-flight query" feature.
//
// Kept outside Zustand because AbortController is a class instance with prototype
// methods — Immer's structural cloning would strip the prototype and abort() would
// become undefined. Module-level state stays alive for the lifetime of the page and
// is GC'd with it, which is the right scope: controllers are only meaningful while
// fetches are in flight.

// queryId -> AbortController for the currently in-flight run or preview.
// Writers (queryPanelSlice runQuery / previewQuery) overwrite on each new invocation.
// Readers (abortQuery) use the latest entry. The .finally() cleanup is identity-checked
// in the slice so an older promise settling can't wipe a newer controller.
export const queryAbortControllers = new Map();

// Some legacy error paths wrap the DOMException, so we check both shapes:
//   e.name === 'AbortError'         — raw rejection from fetch()
//   e.error.name === 'AbortError'   — wrapped by handleResponse / service layer
export const isAbortError = (e) => e?.name === 'AbortError' || e?.error?.name === 'AbortError';

// Bumped when the app's data context (environment, version, restore) reloads. A run or preview
// started under an older context drops its result instead of writing it into the new one.
let queryRunContext = 0;
export const getQueryRunContext = () => queryRunContext;
export const isStaleQueryRun = (runContext) => runContext !== queryRunContext;

// Cancels every in-flight fetch; runs that can't be cancelled (RunJS, RunPy, workflows) are
// dropped by isStaleQueryRun when they settle.
export const discardInFlightQueries = () => {
  queryRunContext += 1;
  queryAbortControllers.forEach((controller) => controller.abort());
  queryAbortControllers.clear();
};
