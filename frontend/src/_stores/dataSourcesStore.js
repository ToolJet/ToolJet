import { create, zustandDevTools } from './utils';
import { datasourceService, globalDatasourceService } from '@/_services';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { useContext } from 'react';
import { useSuperStore } from './superStore';
import { ModuleContext } from '../_contexts/ModuleContext';

export function createDataSourcesStore(moduleName) {
  const initialState = {
    dataSources: [],
    loadingDataSources: true,
    globalDataSources: [],
    sampleDataSource: null,
    globalDataSourceStatus: {
      isSaving: false,
      isEditing: false,
      unSavedModalVisible: false,
      action: null,
      saveAction: null,
    },
    moduleName,
  };

  return create(
    zustandDevTools(
      (set, get) => ({
        ...initialState,
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
                globalDataSources: data.data_sources?.filter((source) => source?.type != DATA_SOURCE_TYPE.SAMPLE),
                sampleDataSource: data.data_sources?.filter((source) => source?.type == DATA_SOURCE_TYPE.SAMPLE)[0],
              });
            });
          },
          setGlobalDataSourceStatus: (status) =>
            set({
              globalDataSourceStatus: {
                ...get().globalDataSourceStatus,
                ...status,
              },
            }),
        },
      }),
      { name: 'Data Source Store' }
    )
  );
}

export const useDataSourcesStore = (callback, shallow) => {
  const moduleName = useContext(ModuleContext);

  if (!moduleName) throw Error('module context not available');

  const _useDataSourcesStore = useSuperStore((state) => state.modules[moduleName].useDataSourcesStore);

  return _useDataSourcesStore(callback, shallow);
};

export const useDataSources = () => useDataSourcesStore((state) => state.dataSources);
export const useGlobalDataSources = () => useDataSourcesStore((state) => state.globalDataSources);
export const useSampleDataSource = () => useDataSourcesStore((state) => state.sampleDataSource);
export const useLoadingDataSources = () => useDataSourcesStore((state) => state.loadingDataSources);
export const useDataSourcesActions = () => useDataSourcesStore((state) => state.actions);
export const useGlobalDataSourcesStatus = () => useDataSourcesStore((state) => state.globalDataSourceStatus);
