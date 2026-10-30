import { libraryQueryService } from '@/_services';
import { queryAbortControllers } from '@/AppBuilder/_utils/queryAbort';

export const isQueryLibraryMode = (state) => !!state.queryLibrary?.isLibraryMode;

export const LIBRARY_DRAFT = 'draft';

// The environment tab picked for a query in its version dropdown, or null. Kept per query, so opening another query
// starts from that query's own default.
const pickedLibraryEnvironment = (state, queryId) => state.queryLibrary.runEnvironmentByQueryId[queryId] ?? null;

// The version the library editor shows for a query: the one picked in the dropdown, else the draft, else the newest
// saved version — limited to the picked environment tab, where the draft only lives in Development.
// 'draft' | library version id; null until the query's versions are loaded, or when the picked tab has none.
export const viewedLibraryVersionId = (state, queryId) => {
  const view = state.queryLibrary.versionsByQueryId[queryId];
  if (!view) return null;
  const environment = pickedLibraryEnvironment(state, queryId);
  const draftShown = !!view.draft && (!environment || environment.priority === 1);
  const versions = environment
    ? view.versions.filter((version) => version.environment?.id === environment.id)
    : view.versions;
  const picked = state.queryLibrary.viewedVersionIdByQueryId[queryId];
  if (picked === LIBRARY_DRAFT ? draftShown : versions.some((version) => version.id === picked)) return picked;
  return draftShown ? LIBRARY_DRAFT : (versions[0]?.id ?? null);
};

// The saved version shown read-only, or null while the draft (or nothing) is shown.
export const viewedSavedLibraryVersion = (state, queryId) => {
  const id = viewedLibraryVersionId(state, queryId);
  if (!id || id === LIBRARY_DRAFT) return null;
  return state.queryLibrary.versionsByQueryId[queryId].versions.find((version) => version.id === id) ?? null;
};

// The environment the library editor shows and runs a query on: the tab picked in the version dropdown, else the
// shown version's environment (the draft lives in Development), else Development.
export const libraryRunEnvironment = (state, queryId) => {
  const development = state.environments?.find((env) => env.priority === 1) ?? null;
  const picked = pickedLibraryEnvironment(state, queryId);
  if (picked) return picked;
  const versionEnvironment = viewedSavedLibraryVersion(state, queryId)?.environment;
  if (!versionEnvironment) return development;
  return state.environments?.find((env) => env.id === versionEnvironment.id) ?? versionEnvironment;
};

// Only the draft, in Development, is editable: a shown saved version, another environment's tab, or a query with no
// draft is read-only.
export const isLibraryQueryLocked = (state, queryId) =>
  !!state.queryLibrary.versionsByQueryId[queryId] &&
  (viewedLibraryVersionId(state, queryId) !== LIBRARY_DRAFT ||
    (libraryRunEnvironment(state, queryId)?.priority ?? 1) !== 1);

// The query as the library editor shows and runs it: a shown saved version replaces the draft's kind and options.
export const withViewedLibraryVersion = (state, query) => {
  const version = query && viewedSavedLibraryVersion(state, query.id);
  return version
    ? {
        ...query,
        kind: version.kind,
        options: version.options,
        data_source_id: version.dataSourceId ?? version.data_source_id,
        dataSourceId: version.dataSourceId ?? version.data_source_id,
      }
    : query;
};

// An empty environment tab has no version to run; saved versions resolve their own source on the server.
export const libraryRunBlocker = (state, query) => {
  if (!query || !state.queryLibrary.versionsByQueryId[query.id]) return null;
  const version = viewedSavedLibraryVersion(state, query.id);
  if (version) return null;
  const environment = libraryRunEnvironment(state, query.id);
  return environment && (environment.priority !== 1 || !state.queryLibrary.versionsByQueryId[query.id].draft)
    ? `No version of this query in ${environment.name}`
    : null;
};

export const createQueryLibrarySlice = (set, get) => {
  const context = () => ({ workspaceId: get().queryLibrary.workspaceId });
  const current = (sessionId) => get().queryLibrary.sessionId === sessionId;
  const clear = () => {
    for (const controller of queryAbortControllers.values()) controller.abort();
    queryAbortControllers.clear();
    set((state) => {
      state.queryPanel.selectedQuery = null;
      state.queryPanel.selectedDataSource = null;
      state.queryPanel.queryPreviewData = '';
      state.queryPanel.previewLoading = false;
      state.queryPanel.isPreviewQueryLoading = false;
      state.queryPanel.queryToBeRun = null;
      state.dataQuery.queries.modules.canvas = [];
      state.dataQuery.queuedActions = {};
      state.dataQuery.queryUpdates = {};
      state.dataQuery.creatingQueryInProcessId = null;
      state.queryLibrary.versionsByQueryId = {};
      state.queryLibrary.viewedVersionIdByQueryId = {};
      state.queryLibrary.runEnvironmentByQueryId = {};
      state.environments = [];
      state.currentVersionId = undefined;
      state.selectedVersion = null;
      state.appVersionEnvironment = null;
      state.developmentVersions = [];
      state.draftVersions = [];
      state.publishedVersions = [];
      state.queryLibrary.isSaving = false;
      state.queryLibrary.saveError = false;
      state.selectedEnvironment = null;
      state.dataSources = [];
      state.globalDataSources = [];
      if (state.queryFolders)
        Object.assign(state.queryFolders, { folders: [], folderMappings: [], foldersReady: false });
    });
    for (const name of [
      'initializeComponentsSlice',
      'initializeResolvedSlice',
      'initializeModeSlice',
      'initializeEventsSlice',
      'initializeDependencySlice',
    ])
      get()[name]?.('canvas');
  };
  const setView = (queryId, view) =>
    set(
      (state) => {
        state.queryLibrary.versionsByQueryId[queryId] = view;
      },
      false,
      'setLibraryVersions'
    );

  const reload = (queryId) => get().queryLibrary.loadLibraryVersions(queryId);

  return {
    queryLibrary: {
      isLibraryMode: false,
      isSaving: false,
      saveError: false,
      workspaceId: null,
      sessionId: 0,
      isCurrentSession: current,
      setLibraryEnvironments: (environments) =>
        set((state) => {
          state.environments = environments;
          state.selectedEnvironment = environments.find((env) => env.priority === 1) ?? null;
        }),
      setLibraryMode: (on) =>
        set((state) => {
          state.queryLibrary.isLibraryMode = on;
        }),
      beginLibrarySession: (workspaceId) => {
        get().queryLibrary.endLibrarySession();
        clear();
        set((state) => {
          state.queryLibrary.isLibraryMode = true;
          state.queryLibrary.workspaceId = workspaceId;
        });
        get().dataQuery.restoreLibrarySaves(workspaceId);
        get().setCurrentMode('edit', 'canvas');
        return get().queryLibrary.sessionId;
      },
      endLibrarySession: (sessionId) => {
        if (sessionId !== undefined && !current(sessionId)) return;
        get().dataQuery.saveData.flush?.();
        get().dataQuery.saveData.cancel?.();
        clear();
        set((state) => {
          state.queryLibrary.isLibraryMode = false;
          state.queryLibrary.workspaceId = null;
          state.queryLibrary.sessionId += 1;
        });
      },
      versionsByQueryId: {},
      viewedVersionIdByQueryId: {},
      runEnvironmentByQueryId: {},

      loadLibraryVersions: async (queryId) => {
        const sessionId = get().queryLibrary.sessionId;
        const view = await libraryQueryService.getVersions(queryId, context());
        if (current(sessionId)) setView(queryId, view);
        return view;
      },

      viewLibraryVersion: (queryId, versionIdOrDraft) =>
        set(
          (state) => {
            state.queryLibrary.viewedVersionIdByQueryId[queryId] = versionIdOrDraft;
          },
          false,
          'viewLibraryVersion'
        ),

      // Like a module's environment tabs: the tab shows its newest saved version (or none); the draft only on Development.
      setLibraryRunEnvironment: (queryId, environment) =>
        set(
          (state) => {
            state.queryLibrary.runEnvironmentByQueryId[queryId] = environment;
            delete state.queryLibrary.viewedVersionIdByQueryId[queryId];
          },
          false,
          'setLibraryRunEnvironment'
        ),

      saveLibraryVersion: async (queryId, { description } = {}) => {
        const sessionId = get().queryLibrary.sessionId;
        const target = context();
        // A throttled save can still be waiting for its trailing call: send it now and wait, so the saved version
        // is the draft the user sees. A failed save means the server still has the old draft: save nothing.
        get().dataQuery.saveData.flush?.();
        try {
          await get().dataQuery.queryUpdates[queryId];
          const failed = get().dataQuery.failedSaves[queryId];
          if (failed?.target.library && failed.target.workspaceId === target.workspaceId) throw failed.error;
        } catch {
          throw { error: 'Save the query before saving a version' };
        }
        const saved = await libraryQueryService.saveVersion(queryId, { description }, target);
        if (!current(sessionId)) return saved;
        get().queryLibrary.viewLibraryVersion(queryId, saved.id);
        await reload(queryId);
        return saved;
      },

      createLibraryDraft: async (queryId, { fromVersionId, description } = {}) => {
        const sessionId = get().queryLibrary.sessionId;
        const target = context();
        get().dataQuery.saveData.flush?.();
        await get().dataQuery.queryUpdates[queryId];
        const view = await libraryQueryService.createDraft(queryId, { fromVersionId, description }, target);
        if (!current(sessionId)) return view;
        // The server copied the source version (content and data source) onto the query row: show the same in the
        // editor, so the next autosave doesn't write the old content back over the new draft.
        const source = view.versions.find((version) => version.id === fromVersionId);
        set(
          (state) => {
            state.queryLibrary.versionsByQueryId[queryId] = view;
            state.queryLibrary.viewedVersionIdByQueryId[queryId] = LIBRARY_DRAFT;
            const query = source && state.dataQuery.queries.modules.canvas?.find((q) => q.id === queryId);
            if (!query) return;
            query.options = source.options;
            query.kind = source.kind;
            query.data_source_id = source.dataSourceId ?? source.data_source_id ?? null;
            query.dataSourceId = query.data_source_id;
          },
          false,
          'createLibraryDraft'
        );
        // Re-select so selectedQuery and its data source follow the row.
        if (source && get().queryPanel.selectedQuery?.id === queryId)
          get().queryPanel.setSelectedQuery(queryId, 'canvas', { fromServer: true });
        return view;
      },

      discardLibraryDraft: async (queryId) => {
        const sessionId = get().queryLibrary.sessionId;
        const target = context();
        get().dataQuery.saveData.flush?.();
        await get().dataQuery.queryUpdates[queryId];
        await libraryQueryService.discardDraft(queryId, target);
        const queries = await libraryQueryService.list(target);
        if (!current(sessionId)) return;
        get().dataQuery.setQueries(queries);
        if (get().queryPanel.selectedQuery?.id === queryId)
          get().queryPanel.setSelectedQuery(queryId, 'canvas', { fromServer: true });
        await reload(queryId);
      },

      promoteLibraryVersion: async (queryId, libraryVersionId) => {
        const sessionId = get().queryLibrary.sessionId;
        const target = context();
        const promoted = await libraryQueryService.promote(queryId, libraryVersionId, target);
        if (current(sessionId)) await reload(queryId);
        return promoted;
      },

      releaseLibraryVersion: async (queryId, libraryVersionId) => {
        const sessionId = get().queryLibrary.sessionId;
        const target = context();
        const released = await libraryQueryService.release(queryId, libraryVersionId, target);
        if (current(sessionId)) await reload(queryId);
        return released;
      },

      deleteLibraryVersion: async (queryId, libraryVersionId) => {
        const sessionId = get().queryLibrary.sessionId;
        const target = context();
        await libraryQueryService.deleteVersion(queryId, libraryVersionId, target);
        if (current(sessionId)) await reload(queryId);
      },
    },
  };
};
