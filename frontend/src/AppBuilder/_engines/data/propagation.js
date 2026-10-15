import { taskQueue } from './taskQueue';
import { SLICE_MS } from './slices';

// A change with this many dependents or fewer always resolves in the writer's own call stack, as it always did.
export const INLINE_DEPENDENTS = 64;

/**
 * Re-resolves the dependents of changed paths (`queries.q.data`, `variables.x`…) without blocking the page: small
 * changes resolve at once, large ones (a query feeding hundreds of components or rows) a slice at a time, with one store
 * write — so one render — per slice instead of one per dependent.
 *
 * Order doesn't matter within a pass: a dependent reads exposed values and writes only resolved values, which no other
 * dependent reads. Exposed values are read once per slice.
 *
 * `propagate()` returns null when everything resolved at once, otherwise a promise for when it has (`settled()`):
 * callers that guarantee "dependents are resolved" (a query run, a variable action) wait for it.
 */
export function createPropagationScheduler({
  set,
  get,
  isSliced = () => true,
  now = () => performance.now(),
  queue = null,
  onError = (error) => console.error(error), // eslint-disable-line no-console
}) {
  let pending = []; // changed paths not yet expanded to dependents
  const items = new Map(); // dependents to resolve, keyed so each resolves once
  let draining = false;
  let continuation = null; // the task queue while a sliced run is waiting for its next slice
  let microtaskQueued = false;
  let waiters = [];

  const isIdle = () => !pending.length && !items.size && !continuation && !microtaskQueued;

  const expand = () => {
    const paths = pending;
    pending = [];
    paths.forEach(({ path, moduleId, parentIndices }) => {
      let dependencies;
      try {
        dependencies = get().getDependencies(path, moduleId);
      } catch (error) {
        onError(error);
        return;
      }
      dependencies?.forEach((dependency) => {
        const key = `${moduleId}\u0000${dependency}\u0000${parentIndices.join('.')}`;
        if (!items.has(key)) items.set(key, { dependency, path, moduleId, parentIndices });
      });
    });
  };

  // Resolves pending dependents for up to `budgetMs` (never stopping before INLINE_DEPENDENTS of them). True when
  // nothing is left.
  const drain = (budgetMs) => {
    if (draining) return false;
    draining = true;
    try {
      const start = now();
      let resolved = 0;
      for (;;) {
        expand();
        if (!items.size) return true;
        const mutations = [];
        const exposedValues = new Map();
        let outOfTime = false;
        for (const [key, item] of items) {
          items.delete(key);
          const { dependency, path, moduleId, parentIndices } = item;
          try {
            if (!exposedValues.has(moduleId)) exposedValues.set(moduleId, get().getAllExposedValues(moduleId));
            get().applyDependencyUpdate(
              dependency,
              path,
              moduleId,
              parentIndices,
              exposedValues.get(moduleId),
              mutations
            );
          } catch (error) {
            // A failing `{{ }}` (or a component removed meanwhile) must not keep the others from resolving.
            onError(error);
          }
          resolved += 1;
          if (resolved > INLINE_DEPENDENTS && now() - start >= budgetMs) {
            outOfTime = true;
            break;
          }
        }
        if (mutations.length) {
          set((state) => mutations.forEach((mutate) => mutate(state)), false, 'propagateDependencies');
        }
        if (outOfTime) return false;
      }
    } finally {
      draining = false;
    }
  };

  const settle = () => {
    if (!isIdle()) return;
    const resolve = waiters;
    waiters = [];
    resolve.forEach((done) => done());
  };

  const run = () => {
    if (drain(isSliced() ? SLICE_MS : Infinity)) {
      continuation?.close();
      continuation = null;
      settle();
      return;
    }
    if (!continuation) continuation = queue ?? taskQueue();
    continuation.schedule(run);
  };

  const settled = () => (isIdle() ? Promise.resolve() : new Promise((resolve) => waiters.push(resolve)));

  return {
    /**
     * Re-resolves what depends on `paths`. At once (as much as fits, see above), or with `defer` in a microtask, so
     * writes made together in the same turn (several setExposedValue calls) resolve their dependents once.
     */
    propagate(paths, moduleId = 'canvas', parentIndices = [], { defer = false } = {}) {
      paths.forEach((path) => pending.push({ path, moduleId, parentIndices }));
      // Already resolving: the running pass (or the next slice) picks these up.
      if (draining || continuation) return settled();
      if (defer) {
        if (!microtaskQueued) {
          microtaskQueued = true;
          queueMicrotask(() => {
            microtaskQueued = false;
            if (!draining && !continuation) run();
          });
        }
        return settled();
      }
      run();
      return isIdle() ? null : settled();
    },

    settled,
    isIdle,

    /** Resolves everything pending now, without slicing (tests, and callers that must read the result at once). */
    flushSync() {
      if (draining) return;
      microtaskQueued = false;
      drain(Infinity);
      continuation?.close();
      continuation = null;
      settle();
    },

    /** Drops pending work (store reset); anyone waiting is released. */
    reset() {
      pending = [];
      items.clear();
      continuation?.close();
      continuation = null;
      microtaskQueued = false;
      const resolve = waiters;
      waiters = [];
      resolve.forEach((done) => done());
    },
  };
}
