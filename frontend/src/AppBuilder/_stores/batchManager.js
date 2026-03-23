/**
 * Creates a ref-counted batch manager for Zustand stores with Immer.
 * Buffers mutations and dependency paths, applies them in a single set() on flush.
 * Supports nested start/flush — only the outermost flush applies.
 *
 * Options:
 *   useShallowReturn {boolean} — when true, the flush set() returns { ...state } after
 *     applying mutations. Required when mutations touch class instances (e.g. DependencyGraph)
 *     that Immer cannot track, so Zustand must be notified via a returned object rather than
 *     draft patches. Dep path cascade is skipped when this is set (graph construction only).
 */
export function createBatchManager(set, get, options = {}) {
  const { useShallowReturn = false } = options;
  let _depth = 0;
  let _mutations = [];
  let _depPaths = [];

  return {
    isBatching: () => _depth > 0,

    startBatch: () => {
      _depth++;
      if (_depth === 1) {
        _mutations = [];
        _depPaths = [];
      }
    },

    bufferMutation: (mutation, depPaths) => {
      _mutations.push(mutation);
      if (depPaths?.length) _depPaths.push(...depPaths);
    },

    flush: (actionName = 'batchFlush') => {
      _depth--;
      if (_depth > 0) return;
      _depth = 0;

      const mutations = _mutations;
      const depPaths = _depPaths;
      _mutations = [];
      _depPaths = [];

      if (mutations.length === 0) return;

      set(
        (state) => {
          mutations.forEach((m) => m(state));
          if (useShallowReturn) return { ...state };
        },
        false,
        actionName
      );

      if (useShallowReturn) return;

      const seen = new Set();
      depPaths.forEach(({ path, moduleId }) => {
        const key = `${path}|${moduleId}`;
        if (seen.has(key)) return;
        seen.add(key);
        get().updateDependencyValues(path, moduleId);
      });
    },
  };
}

export const yieldToMain = () =>
  typeof scheduler !== 'undefined' && 'yield' in scheduler
    ? scheduler.yield()
    : new Promise(resolve => setTimeout(resolve, 0));
