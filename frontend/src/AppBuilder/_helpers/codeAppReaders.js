/*
  Which queries an open screen of a code app reads, and when each last started a run. Library components register here
  through their query hook; runOnLoadQueries reads it to re-run, after an AI turn or an environment switch, only the
  page-load results someone is looking at. Plain module state, not store state: it changes on every screen open.
*/
const readers = new Map();
const lastRun = new Map();

const keyOf = (moduleId, queryId) => `${moduleId}:${queryId}`;

/** Registers a reader of the query; returns the function that removes it. */
export const addCodeAppReader = (moduleId, queryId) => {
  const key = keyOf(moduleId, queryId);
  readers.set(key, (readers.get(key) ?? 0) + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const left = (readers.get(key) ?? 1) - 1;
    if (left > 0) readers.set(key, left);
    else readers.delete(key);
  };
};

export const markCodeAppRun = (moduleId, queryId) => lastRun.set(keyOf(moduleId, queryId), Date.now());

/** A screen reads the query now, and its result is from a run that started before `since`. */
export const codeAppReadsResultFrom = (moduleId, queryId, since) => {
  const key = keyOf(moduleId, queryId);
  const at = lastRun.get(key);
  return (readers.get(key) ?? 0) > 0 && at !== undefined && at < since;
};
