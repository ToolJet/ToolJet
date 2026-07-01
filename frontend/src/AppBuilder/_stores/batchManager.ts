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

type Mutation<S> = (state: S) => void;

interface DepPath {
  path: string;
  moduleId: string;
}

interface BatchManagerOptions {
  useShallowReturn?: boolean;
}

interface StoreWithDependencies {
  updateDependencyValues: (path: string, moduleId: string) => void;
}

type ImmerSet<S> = (
  updater: (state: S) => S | Partial<S> | void,
  replace?: boolean,
  actionName?: string
) => void;

type StoreGet<S> = () => S;

export function createBatchManager<S extends StoreWithDependencies>(
  set: ImmerSet<S>,
  get: StoreGet<S>,
  options: BatchManagerOptions = {}
) {
  const { useShallowReturn = false } = options;
  let _depth = 0;
  let _mutations: Mutation<S>[] = [];
  let _depPaths: DepPath[] = [];
  // Post-flush callbacks: keyed for deduplication (same key → only first callback registered).
  let _postFlushKeys: Set<string> = new Set();
  let _postFlushCallbacks: Array<() => void> = [];

  return {
    isBatching: () => _depth > 0,

    // Drops any open batch without applying it. For store resets: an async flow
    // (e.g. switchPage's doSwitch) can open a batch and then never flush because its
    // owner unmounted — this closure state survives resetAllStores, so it must be
    // cleared explicitly or every subsequent write stays buffered forever.
    reset: () => {
      _depth = 0;
      _mutations = [];
      _depPaths = [];
      _postFlushKeys = new Set();
      _postFlushCallbacks = [];
    },

    startBatch: () => {
      _depth++;
      if (_depth === 1) {
        _mutations = [];
        _depPaths = [];
        _postFlushKeys = new Set();
        _postFlushCallbacks = [];
      }
    },

    bufferMutation: (mutation: Mutation<S>, depPaths?: DepPath[]) => {
      _mutations.push(mutation);
      if (depPaths?.length) _depPaths.push(...depPaths);
    },

    bufferDepPath: (path: string, moduleId: string) => {
      _depPaths.push({ path, moduleId });
    },

    // Register a callback to run after the outermost flush completes.
    // dedupeKey: if provided, only the first registration with that key is kept.
    bufferPostFlushCallback: (cb: () => void, dedupeKey?: string) => {
      if (dedupeKey !== undefined) {
        if (_postFlushKeys.has(dedupeKey)) return;
        _postFlushKeys.add(dedupeKey);
      }
      _postFlushCallbacks.push(cb);
    },

    flush: (actionName = 'batchFlush') => {
      if (_depth === 0) return;
      _depth--;
      if (_depth > 0) return;

      const mutations = _mutations;
      const depPaths = _depPaths;
      const postFlushCallbacks = _postFlushCallbacks;
      _mutations = [];
      _depPaths = [];
      _postFlushKeys = new Set();
      _postFlushCallbacks = [];

      if (mutations.length === 0 && depPaths.length === 0) {
        postFlushCallbacks.forEach((cb) => cb());
        return;
      }

      if (mutations.length > 0) {
        set(
          (state) => {
            mutations.forEach((m) => m(state));
            if (useShallowReturn) return { ...state };
          },
          false,
          actionName
        );
        if (useShallowReturn) {
          postFlushCallbacks.forEach((cb) => cb());
          return;
        }
      }

      const seen = new Set<string>();
      depPaths.forEach(({ path, moduleId }) => {
        const key = `${path}|${moduleId}`;
        if (seen.has(key)) return;
        seen.add(key);
        get().updateDependencyValues(path, moduleId);
      });

      postFlushCallbacks.forEach((cb) => cb());
    },
  };
}

declare const scheduler: { yield(): Promise<void> } | undefined;

export const yieldToMain = (): Promise<void> =>
  typeof scheduler !== 'undefined' && 'yield' in scheduler
    ? scheduler.yield()
    : new Promise((resolve) => setTimeout(resolve, 0));
