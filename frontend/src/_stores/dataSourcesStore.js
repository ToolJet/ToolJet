import { create, zustandDevTools } from './utils';
import { datasourceService, globalDatasourceService } from '@/_services';

const initialState = {
  dataSources: [],
  loadingDataSources: true,
  globalDataSources: [],
};

export const useDataSourcesStore = create(
  zustandDevTools((set) => ({
    ...initialState,
    actions: {
      fetchDataSources: (appId, environmentId) => {
        set({ loadingDataSources: true });
        datasourceService.getAll(appId, environmentId).then((data) => {
          set({
            dataSources: data.data_sources,
            loadingDataSources: false,
          });
        });
      },
      fetchGlobalDataSources: (organizationId, appVersionId, environmentId) => {
        globalDatasourceService.getAll(organizationId, appVersionId, environmentId).then((data) => {
          set({
            globalDataSources: data.data_sources,
          });
        });
      },
    },
  }))
);

export const useDataSources = () => useDataSourcesStore((state) => state.dataSources);
export const useGlobalDataSources = () => useDataSourcesStore((state) => state.globalDataSources);
export const useLoadingDataSources = () => useDataSourcesStore((state) => state.loadingDataSources);
export const useDataSourcesActions = () => useDataSourcesStore((state) => state.actions);
