import { datasourceService, globalDatasourceService } from '@/_services';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';

function updateExposedDataSources(state) {
  const allSources = [...(state.dataSources || []), ...(state.globalDataSources || [])];
  const exposed = {};
  for (const ds of allSources) {
    if (ds.name) {
      exposed[ds.name] = { id: ds.id, name: ds.name, kind: ds.kind };
    }
  }
  if (state.resolvedStore?.modules?.canvas?.exposedValues) {
    state.resolvedStore.modules.canvas.exposedValues.dataSources = exposed;
  }
}

const initialState = {
  dataSources: [],
  loadingDataSources: true,
  globalDataSources: [],
  sampleDataSource: null,
  isFetchingGlobalDataSource: false,
  globalDataSourceList: null,
  sampleDataSourceList: null,
  // Set of datasource ids the user may tag in the AI prompt (RBAC-filtered). `null` = not loaded
  // yet → the AI list falls back to the full RBAC list; the server still drops inaccessible tags.
  aiTaggableDataSourceIds: null,
  isFetchingAiTaggableDataSources: false,
};

export const createDataSourceSlice = (set, get) => ({
  ...initialState,
  setDataSources: (dataSources) =>
    set(
      (state) => {
        state.dataSources = dataSources;
        updateExposedDataSources(state);
      },
      false,
      'setDataSources'
    ),
  fetchDataSources: (appId, environmentId) => {
    set({ loadingDataSources: true });
    datasourceService.getAll(appId, environmentId).then((data) => {
      set(
        (state) => {
          state.dataSources = data.data_sources;
          state.loadingDataSources = false;
          updateExposedDataSources(state);
        },
        false,
        'fetchDataSources'
      );
      get().rebuildDataSourceHints?.();
    });
  },

  fetchGlobalDataSources: (organizationId, appVersionId, environmentId, options) => {
    set({ loadingDataSources: true });
    globalDatasourceService
      .getForApp(organizationId, appVersionId, environmentId)
      .then((data) => {
        set(
          (state) => {
            state.globalDataSources = data.data_sources?.filter((source) => source?.type != DATA_SOURCE_TYPE.SAMPLE);
            state.sampleDataSource = data.data_sources?.filter((source) => source?.type == DATA_SOURCE_TYPE.SAMPLE)[0];
            state.loadingDataSources = false;
            updateExposedDataSources(state);
          },
          false,
          'fetchGlobalDataSources'
        );
        get().rebuildDataSourceHints?.();
        options?.onSuccess?.(data);
      })
      .catch((err) => {
        console.error('fetchGlobalDataSources failed', err);
        set({ loadingDataSources: false });
      });
  },
  getAiTaggableDataSourceIds: () => {
    set({ isFetchingAiTaggableDataSources: true });

    globalDatasourceService
      .getAiTaggableDataSources()
      .then((data) => {
        set({ aiTaggableDataSourceIds: new Set((data ?? []).map((ds) => ds.id)) });
      })
      .catch(() => {
        // Fail open: leave ids null so the AI list falls back to the full RBAC list. The server
        // still drops inaccessible tags before they reach the agent (AiService.sendUserMessage).
      })
      .finally(() => {
        set({ isFetchingAiTaggableDataSources: false });
      });
  },
  getAllGlobalDataSourceList: (organizationId, options) => {
    set({ isFetchingGlobalDataSource: true });

    globalDatasourceService
      .getAll(organizationId)
      .then((data) => {
        set({
          globalDataSourceList: data.data_sources?.filter((source) => source?.type !== DATA_SOURCE_TYPE.SAMPLE) ?? [],
          sampleDataSourceList: data.data_sources?.filter((source) => source?.type === DATA_SOURCE_TYPE.SAMPLE) ?? [],
        });

        options?.onSuccess?.(data);
      })
      .finally(() => {
        set({
          isFetchingGlobalDataSource: false,
        });
      });
  },
});
