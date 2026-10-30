import { getEditionSpecificSlice } from '@/modules/common/helpers/getEditionSpecificSlice';
import { isLibraryVersionInEnvironment } from '@/AppBuilder/_utils/libraryVersionEnvironment';

export const isQueryLibraryMode = (state) => !!state.queryLibrary?.isLibraryMode;

export const LIBRARY_DRAFT = 'draft';

// The environment tab picked for a query in its version dropdown, or null. Kept per query, so opening another query
// starts from that query's own default.
export const pickedLibraryEnvironment = (state, queryId) =>
  state.queryLibrary?.runEnvironmentByQueryId?.[queryId] ?? null;

// Draft IDs and saved IDs share one lifecycle identity; the backend determines their status.
export const viewedLibraryVersionId = (state, queryId) => {
  const view = state.queryLibrary?.versionsByQueryId?.[queryId];
  if (!view) return null;
  const environment = pickedLibraryEnvironment(state, queryId);
  const membership = { targetEnvironment: environment, environments: state.environments };
  const rows = [
    ...(isLibraryVersionInEnvironment({ ...membership, isDraft: true }) ? (view.drafts ?? []) : []),
    ...(view.versions ?? []).filter((version) =>
      isLibraryVersionInEnvironment({ ...membership, versionEnvironment: version.environment })
    ),
  ];
  const picked = state.queryLibrary?.viewedVersionIdByQueryId?.[queryId];
  return rows.find((row) => row.id === picked)?.id ?? rows[0]?.id ?? null;
};
export const viewedLibraryDraft = (state, queryId) =>
  state.queryLibrary?.versionsByQueryId?.[queryId]?.drafts?.find(
    (draft) => draft.id === viewedLibraryVersionId(state, queryId)
  ) ?? null;
export const viewedSavedLibraryVersion = (state, queryId) =>
  state.queryLibrary?.versionsByQueryId?.[queryId]?.versions?.find(
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

export const createQueryLibrarySlice = (set, get) => ({
  queryLibrary: {
    isLibraryMode: false,
    isSaving: false,
    saveError: false,
    workspaceId: null,
    sessionId: 0,
    versionsByQueryId: {},
    viewedVersionIdByQueryId: {},
    runEnvironmentByQueryId: {},
    ...getEditionSpecificSlice('createQueryLibrarySlice')(set, get).queryLibrary,
  },
});
