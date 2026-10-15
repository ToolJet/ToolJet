/**
 * Ref-counted batch manager for Zustand + Immer stores. Buffers mutations and dependency
 * paths, applies them all in one set() when the outermost flush() runs.
 *
 * Every buffered entry is tagged with a moduleId. flush() ignores the tag and applies
 * everything. cancelBatch(moduleId) discards only that moduleId's entries, so cancelling
 * one owner (e.g. a page switch on 'canvas') can't destroy another owner's (e.g. an
 * embedded Module's) still-pending writes just because they share the same open batch.
 *
 * Options.useShallowReturn: flush's set() returns { ...state } instead of relying on Immer
 * draft patches — needed when mutations touch class instances (e.g. DependencyGraph) Immer
 * can't track. Skips the dep-path cascade (graph construction only).
 */

type Mutation<S> = (state: S) => void;

interface DepPath {
  path: string;
  moduleId: string;
}

interface TaggedMutation<S> {
  moduleId: string;
  mutation: Mutation<S>;
}

interface TaggedCallback {
  moduleId: string;
  cb: () => void;
  dedupeKey?: string;
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
  let _mutations: TaggedMutation<S>[] = [];
  let _depPaths: DepPath[] = [];
  // Post-flush callbacks: keyed for deduplication (same key → only first callback registered).
  let _postFlushKeys: Set<string> = new Set();
  let _postFlushCallbacks: TaggedCallback[] = [];

  const resetBuffers = () => {
    _mutations = [];
    _depPaths = [];
    _postFlushKeys = new Set();
    _postFlushCallbacks = [];
  };

  // Applies a set of already-collected entries (used by both flush() and the
  // depth-reaches-0 tail of cancelBatch()) and runs their post-flush callbacks.
  const settle = (
    mutations: TaggedMutation<S>[],
    depPaths: DepPath[],
    postFlushCallbacks: TaggedCallback[],
    actionName: string
  ) => {
    if (mutations.length === 0 && depPaths.length === 0) {
      postFlushCallbacks.forEach(({ cb }) => cb());
      return;
    }

    if (mutations.length > 0) {
      set(
        (state) => {
          mutations.forEach(({ mutation }) => mutation(state));
          if (useShallowReturn) return { ...state };
        },
        false,
        actionName
      );
      if (useShallowReturn) {
        postFlushCallbacks.forEach(({ cb }) => cb());
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

    postFlushCallbacks.forEach(({ cb }) => cb());
  };

  return {
    isBatching: () => _depth > 0,

    startBatch: () => {
      _depth++;
      if (_depth === 1) resetBuffers();
    },

    bufferMutation: (mutation: Mutation<S>, moduleId: string, depPaths?: DepPath[]) => {
      _mutations.push({ mutation, moduleId });
      if (depPaths?.length) _depPaths.push(...depPaths);
    },

    bufferDepPath: (path: string, moduleId: string) => {
      _depPaths.push({ path, moduleId });
    },

    // Runs once this moduleId's entries land (its own flush, or another moduleId's cancel
    // reaching depth 0). dedupeKey, if given, keeps only the first registration.
    bufferPostFlushCallback: (cb: () => void, moduleId: string, dedupeKey?: string) => {
      if (dedupeKey !== undefined) {
        if (_postFlushKeys.has(dedupeKey)) return;
        _postFlushKeys.add(dedupeKey);
      }
      _postFlushCallbacks.push({ cb, moduleId, dedupeKey });
    },

    flush: (actionName = 'batchFlush') => {
      if (_depth === 0) {
        return;
      }
      _depth--;
      if (_depth > 0) {
        return;
      }

      const mutations = _mutations;
      const depPaths = _depPaths;
      const postFlushCallbacks = _postFlushCallbacks;
      resetBuffers();

      settle(mutations, depPaths, postFlushCallbacks, actionName);
    },

    // Like flush(), but discards only moduleId's entries instead of applying everything.
    // Other moduleIds' entries survive and, if this reaches depth 0, get applied normally.
    cancelBatch: (moduleId: string) => {
      if (_depth === 0) {
        return;
      }
      _depth--;

      _mutations = _mutations.filter((m) => m.moduleId !== moduleId);
      _depPaths = _depPaths.filter((p) => p.moduleId !== moduleId);

      const keep: TaggedCallback[] = [];
      _postFlushCallbacks.forEach((p) => {
        if (p.moduleId === moduleId) {
          // Un-arm its dedupe key so a fresh registration under the same key isn't
          // mistaken for a duplicate and dropped.
          if (p.dedupeKey !== undefined) _postFlushKeys.delete(p.dedupeKey);
        } else {
          keep.push(p);
        }
      });
      _postFlushCallbacks = keep;

      if (_depth > 0) {
        return;
      }

      const mutations = _mutations;
      const depPaths = _depPaths;
      const postFlushCallbacks = _postFlushCallbacks;
      resetBuffers();

      settle(mutations, depPaths, postFlushCallbacks, 'batchCancel');
    },
  };
}

declare const scheduler: { yield(): Promise<void> } | undefined;

export const yieldToMain = (): Promise<void> =>
  typeof scheduler !== 'undefined' && 'yield' in scheduler
    ? scheduler.yield()
    : new Promise((resolve) => setTimeout(resolve, 0));
