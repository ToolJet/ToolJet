import { create, zustandDevTools } from './utils';
import { datasourceService, globalDatasourceService } from '@/_services';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';

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
};

export const useDataSourcesStore = create(
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

export const useDataSources = () => useDataSourcesStore((state) => state.dataSources);
export const useGlobalDataSources = () => useDataSourcesStore((state) => state.globalDataSources);
export const useSampleDataSource = () => useDataSourcesStore((state) => state.sampleDataSource);
export const useLoadingDataSources = () => useDataSourcesStore((state) => state.loadingDataSources);
export const useDataSourcesActions = () => useDataSourcesStore((state) => state.actions);
export const useGlobalDataSourcesStatus = () => useDataSourcesStore((state) => state.globalDataSourceStatus);
