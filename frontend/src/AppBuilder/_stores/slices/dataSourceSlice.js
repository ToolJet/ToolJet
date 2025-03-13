import { datasourceService, globalDatasourceService } from '@/_services';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';

const initialState = {
  dataSources: [],
  loadingDataSources: true,
  globalDataSources: [],
  sampleDataSource: null,
};

export const createDataSourceSlice = (set) => ({
  ...initialState,
  setDataSources: (dataSources) =>
    set(
      (state) => {
        state.dataSources = dataSources;
      },
      false,
      'setDataSources'
    ),
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
    set({ loadingDataSources: true });
    globalDatasourceService.getForApp(organizationId, appVersionId, environmentId).then((data) => {
      set({
        globalDataSources: data.data_sources?.filter((source) => source?.type != DATA_SOURCE_TYPE.SAMPLE),
        sampleDataSource: data.data_sources?.filter((source) => source?.type == DATA_SOURCE_TYPE.SAMPLE)[0],
        loadingDataSources: false,
      });
    });
  },
});
