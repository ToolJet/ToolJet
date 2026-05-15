/**
 * Per-(moduleId, queryId) monotonic run-sequence helpers used by
 * `runQuery` in `queryPanelSlice.js` to discard stale async responses.
 *
 * When the same query is triggered rapidly multiple times, network and
 * transform latency can let an older response arrive after a newer one.
 * Without guarding, the older response would overwrite the newer one in
 * the resolved store and widgets would render stale data.
 *
 * Each `runQuery` invocation captures `nextQueryRunId(moduleId, queryId)`
 * before issuing the request. State writes derived from that invocation
 * are gated by `isLatestQueryRun(moduleId, queryId, runId)`: as soon as a
 * newer invocation supersedes it, all of its callbacks become no-ops.
 *
 * The sequence Map is intentionally NOT stored in the Zustand slice — it
 * is internal bookkeeping that must not trigger React re-renders.
 */

const queryRunSequence = new Map();

const keyOf = (moduleId, queryId) => `${moduleId}::${queryId}`;

/**
 * Reserve a fresh run id for the (moduleId, queryId) pair. The first call
 * for a given pair returns 1, each subsequent call returns the previous
 * value plus one.
 *
 * @param {string} moduleId
 * @param {string} queryId
 * @returns {number} the new latest run id for that pair
 */
export const nextQueryRunId = (moduleId, queryId) => {
  const key = keyOf(moduleId, queryId);
  const next = (queryRunSequence.get(key) ?? 0) + 1;
  queryRunSequence.set(key, next);
  return next;
};

/**
 * True iff `runId` is still the most recent run id reserved for the
 * (moduleId, queryId) pair. False once a newer `nextQueryRunId` call has
 * superseded it.
 *
 * @param {string} moduleId
 * @param {string} queryId
 * @param {number} runId
 * @returns {boolean}
 */
export const isLatestQueryRun = (moduleId, queryId, runId) => {
  return queryRunSequence.get(keyOf(moduleId, queryId)) === runId;
};

/**
 * Drop the sequence entry for (moduleId, queryId). Intended to be called
 * from query-deletion paths so the Map does not accumulate dead entries
 * for queries that no longer exist. Safe to call when no entry exists.
 *
 * @param {string} moduleId
 * @param {string} queryId
 */
export const clearQueryRunSequence = (moduleId, queryId) => {
  queryRunSequence.delete(keyOf(moduleId, queryId));
};

/**
 * Test-only helper that wipes the entire sequence Map. Exported so tests
 * can isolate themselves from each other; not intended for production use.
 */
export const __resetQueryRunSequence = () => {
  queryRunSequence.clear();
};
