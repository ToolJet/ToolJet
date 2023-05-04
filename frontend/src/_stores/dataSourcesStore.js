import { create } from 'zustand';
import { zustandDevTools } from './utils';
import { datasourceService, globalDatasourceService } from '@/_services';

export const useDataSourcesStore = create(
  zustandDevTools((set) => ({
    dataSources: [],
    loadingDataSources: true,
    globalDataSources: [],
    actions: {
      fetchDataSources: (appId) => {
        set({ loadingDataSources: true });
        datasourceService.getAll(appId).then((data) => {
          set({
            dataSources: data.data_sources,
            loadingDataSources: false,
          });
        });
      },
      fetchGlobalDataSources: (organizationId) => {
        globalDatasourceService.getAll(organizationId).then((data) => {
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
