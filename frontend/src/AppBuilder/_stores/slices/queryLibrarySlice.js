import { libraryQueryService } from '@/_services';
import { queryAbortControllers } from '@/AppBuilder/_utils/queryAbort';

export const isQueryLibraryMode = (state) => !!state.queryLibrary?.isLibraryMode;

export const LIBRARY_DRAFT = 'draft';

// The environment tab picked for a query in its version dropdown, or null. Kept per query, so opening another query
// starts from that query's own default.
const pickedLibraryEnvironment = (state, queryId) => state.queryLibrary.runEnvironmentByQueryId[queryId] ?? null;

// Draft IDs and saved IDs share one lifecycle identity; the backend determines their status.
export const viewedLibraryVersionId = (state, queryId) => {
  const view = state.queryLibrary.versionsByQueryId[queryId];
  if (!view) return null;
  const environment = pickedLibraryEnvironment(state, queryId);
  const rows = [
    ...(!environment || environment.priority === 1 ? (view.drafts ?? []) : []),
    ...(view.versions ?? []).filter((version) => !environment || version.environment?.id === environment.id),
  ];
  const picked = state.queryLibrary.viewedVersionIdByQueryId[queryId];
  return rows.find((row) => row.id === picked)?.id ?? rows[0]?.id ?? null;
};
export const viewedLibraryDraft = (state, queryId) =>
  state.queryLibrary.versionsByQueryId[queryId]?.drafts?.find(
    (draft) => draft.id === viewedLibraryVersionId(state, queryId)
  ) ?? null;
export const viewedSavedLibraryVersion = (state, queryId) =>
  state.queryLibrary.versionsByQueryId[queryId]?.versions?.find(
    (version) => version.id === viewedLibraryVersionId(state, queryId)
  ) ?? null;

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
  isQueryLibraryMode(state) &&
  (!viewedLibraryDraft(state, queryId) || (libraryRunEnvironment(state, queryId)?.priority ?? 1) !== 1);

export const withViewedLibraryVersion = (state, query) => {
  if (!query || !isQueryLibraryMode(state)) return query;
  const snapshot = viewedLibraryDraft(state, query.id) ?? viewedSavedLibraryVersion(state, query.id);
  return snapshot
    ? {
        ...query,
        kind: snapshot.kind,
        options: snapshot.options,
        data_source_id: snapshot.dataSourceId,
        dataSourceId: snapshot.dataSourceId,
      }
    : query;
};
export const libraryRunBlocker = (state, query) => {
  if (!query || !isQueryLibraryMode(state)) return null;
  return viewedLibraryVersionId(state, query.id)
    ? null
    : `No version of this query in ${libraryRunEnvironment(state, query.id)?.name ?? 'Development'}`;
};

export const createQueryLibrarySlice = (set, get) => {
  const context = () => ({ workspaceId: get().queryLibrary.workspaceId });
  const refreshes = new Map();
  const cancelSelection = () => {
    get().dataQuery.saveData.flush?.();
    for (const controller of queryAbortControllers.values()) controller.abort();
    queryAbortControllers.clear();
    set((state) => {
      state.dataQuery.isUpdatingQueryInProcess = false;
      state.queryPanel.queryPreviewData = '';
      state.queryPanel.previewLoading = false;
      state.queryPanel.isPreviewQueryLoading = false;
    });
  };
  const current = (sessionId) => get().queryLibrary.sessionId === sessionId;
  const clear = () => {
    for (const controller of queryAbortControllers.values()) controller.abort();
    queryAbortControllers.clear();
    set((state) => {
      state.queryPanel.selectedQuery = null;
      state.queryPanel.selectedDataSource = null;
      state.dataQuery.isUpdatingQueryInProcess = false;
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

        get().setCurrentMode('edit', 'canvas');
        return get().queryLibrary.sessionId;
      },
      endLibrarySession: (sessionId) => {
        if (sessionId !== undefined && !current(sessionId)) return;
        get().dataQuery.saveData.flush?.();
        get().dataQuery.saveData.cancel?.();
        get().dataQuery.clearLibraryDraftWrites?.();
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
        const token = Symbol(queryId);
        refreshes.set(queryId, token);
        const view = await libraryQueryService.getVersions(queryId, context());
        if (current(sessionId) && refreshes.get(queryId) === token) {
          // Keep unsent/failed local options when a lifecycle refresh races autosave.
          const drafts = (view.drafts ?? []).map((draft) => {
            const pending = get().dataQuery.libraryDraftWrite?.(queryId, draft.id);
            return pending ? { ...draft, options: pending.values.options } : draft;
          });
          setView(queryId, { ...view, drafts });
          if (get().queryPanel.selectedQuery?.id === queryId)
            get().queryPanel.setSelectedQuery(queryId, 'canvas', { fromServer: true });
        }
        return view;
      },
      updateCreatedLibraryQuery: (query, snapshot) =>
        set((state) => {
          state.queryLibrary.versionsByQueryId[query.id] = {
            drafts: [
              {
                kind: snapshot.kind,
                options: snapshot.options,
                dataSourceId: snapshot.dataSourceId,
                id: query.draftId,
                name: 'v1',
              },
            ],
            versions: [],
          };
          state.queryLibrary.viewedVersionIdByQueryId[query.id] = query.draftId;
        }),
      changeLibraryDraftDataSource: async (queryId, draftId, dataSourceId) => {
        const sessionId = get().queryLibrary.sessionId;
        const target = context();
        await get().dataQuery.flushLibraryDraft(queryId, draftId);
        if (!current(sessionId)) throw new Error('Library session changed');
        const draft = await get().dataQuery.queueLibraryDraftOperation(queryId, draftId, () =>
          libraryQueryService.changeDraftDataSource(queryId, draftId, dataSourceId, target)
        );
        if (current(sessionId)) {
          const pending = get().dataQuery.libraryDraftWrite(queryId, draftId);
          get().queryLibrary.updateLibraryDraftSnapshot(
            queryId,
            draftId,
            pending ? { ...draft, options: pending.values.options } : draft
          );
        }
        return draft;
      },
      updateLibraryDraftSnapshot: (queryId, draftId, patch) =>
        set((state) => {
          const draft = state.queryLibrary.versionsByQueryId[queryId]?.drafts?.find((row) => row.id === draftId);
          if (draft) Object.assign(draft, patch);
        }),
      viewLibraryVersion: (queryId, versionId) => {
        if (!versionId || versionId === LIBRARY_DRAFT) throw new Error('Select an explicit version ID');
        cancelSelection();
        set((state) => {
          state.queryLibrary.viewedVersionIdByQueryId[queryId] = versionId;
        });
        get().dataQuery.refreshLibrarySaveStatus?.();
        if (get().queryPanel.selectedQuery?.id === queryId)
          get().queryPanel.setSelectedQuery(queryId, 'canvas', { fromServer: true });
      },

      // Like a module's environment tabs: the tab shows its newest saved version (or none); the draft only on Development.
      setLibraryRunEnvironment: (queryId, environment) => {
        cancelSelection();
        return set(
          (state) => {
            state.queryLibrary.runEnvironmentByQueryId[queryId] = environment;
            delete state.queryLibrary.viewedVersionIdByQueryId[queryId];
          },
          false,
          'setLibraryRunEnvironment'
        );
      },

      saveLibraryDraft: async (queryId, draftId, body) => {
        const selectedId = viewedLibraryVersionId(get(), queryId);
        const selectedQueryId = get().queryPanel.selectedQuery?.id;
        const sessionId = get().queryLibrary.sessionId;
        const target = context();
        await get().dataQuery.flushLibraryDraft(queryId, draftId);
        if (!current(sessionId)) throw new Error('Library session changed');
        const saved = await libraryQueryService.saveDraft(queryId, draftId, body, target);
        if (!current(sessionId)) return saved;
        await reload(queryId);
        if (
          current(sessionId) &&
          selectedId === viewedLibraryVersionId(get(), queryId) &&
          selectedQueryId === get().queryPanel.selectedQuery?.id
        )
          get().queryLibrary.viewLibraryVersion(queryId, saved.id);
        return saved;
      },
      saveLibraryVersion: (queryId, body) =>
        get().queryLibrary.saveLibraryDraft(queryId, viewedLibraryDraft(get(), queryId)?.id, body),
      editLibraryDraft: async (queryId, draftId, patch) => {
        const sessionId = get().queryLibrary.sessionId;
        const target = context();
        await get().dataQuery.flushLibraryDraft(queryId, draftId);
        if (!current(sessionId)) throw new Error('Library session changed');
        const draft = await libraryQueryService.updateDraft(queryId, draftId, patch, target);
        if (current(sessionId)) {
          const pending = get().dataQuery.libraryDraftWrite(queryId, draftId);
          get().queryLibrary.updateLibraryDraftSnapshot(
            queryId,
            draftId,
            pending ? { ...draft, options: pending.values.options } : draft
          );
        }
        return draft;
      },
      createLibraryDraft: async (queryId, body) => {
        const selectedId = viewedLibraryVersionId(get(), queryId);
        const selectedQueryId = get().queryPanel.selectedQuery?.id;
        const selectedEnvironment = pickedLibraryEnvironment(get(), queryId);
        const sessionId = get().queryLibrary.sessionId;
        const ownsSelection = () =>
          current(sessionId) &&
          selectedId === viewedLibraryVersionId(get(), queryId) &&
          selectedQueryId === get().queryPanel.selectedQuery?.id &&
          selectedEnvironment === pickedLibraryEnvironment(get(), queryId);
        const draft = await libraryQueryService.createDraft(queryId, body, context());
        if (!current(sessionId)) return draft;
        const selectCreated = ownsSelection();
        await reload(queryId);
        if (selectCreated && ownsSelection()) {
          cancelSelection();
          set((state) => {
            state.queryLibrary.runEnvironmentByQueryId[queryId] =
              state.environments.find((environment) => environment.priority === 1) ?? null;
            state.queryLibrary.viewedVersionIdByQueryId[queryId] = draft.id;
          });
          get().dataQuery.refreshLibrarySaveStatus?.();
          get().queryPanel.setSelectedQuery(queryId, 'canvas', { fromServer: true });
        }
        return draft;
      },
      deleteLibraryDraft: async (queryId, draftId) => {
        const sessionId = get().queryLibrary.sessionId;
        const target = context();
        await get().dataQuery.flushLibraryDraft(queryId, draftId);
        if (!current(sessionId)) throw new Error('Library session changed');
        await libraryQueryService.deleteDraft(queryId, draftId, target);
        if (current(sessionId)) {
          await reload(queryId);
          if (current(sessionId) && get().queryPanel.selectedQuery?.id === queryId)
            get().queryPanel.setSelectedQuery(queryId, 'canvas', { fromServer: true });
        }
      },
      discardLibraryDraft: (queryId) =>
        get().queryLibrary.deleteLibraryDraft(queryId, viewedLibraryDraft(get(), queryId)?.id),

      promoteLibraryVersion: async (queryId, libraryVersionId) => {
        const sessionId = get().queryLibrary.sessionId;
        const selectedId = viewedLibraryVersionId(get(), queryId);
        const selectedQueryId = get().queryPanel.selectedQuery?.id;
        const selectedEnvironment = pickedLibraryEnvironment(get(), queryId);
        const target = context();
        const promoted = await libraryQueryService.promote(queryId, libraryVersionId, target);
        if (!current(sessionId)) return promoted;
        if (
          selectedId === libraryVersionId &&
          selectedId === viewedLibraryVersionId(get(), queryId) &&
          selectedQueryId === queryId &&
          selectedQueryId === get().queryPanel.selectedQuery?.id &&
          selectedEnvironment === pickedLibraryEnvironment(get(), queryId)
        ) {
          cancelSelection();
          // Move the selected snapshot and environment together before refreshing its view.
          set((state) => {
            const view = state.queryLibrary.versionsByQueryId[queryId];
            view.versions = view.versions.map((row) => (row.id === promoted.id ? promoted : row));
            state.queryLibrary.runEnvironmentByQueryId[queryId] =
              state.environments.find((environment) => environment.id === promoted.environment?.id) ??
              promoted.environment;
            state.queryLibrary.viewedVersionIdByQueryId[queryId] = promoted.id;
          });
          get().queryPanel.setSelectedQuery(queryId, 'canvas', { fromServer: true });
        }
        await reload(queryId);
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
