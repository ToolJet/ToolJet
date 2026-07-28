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
