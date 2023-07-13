import { create, zustandDevTools } from './utils';
import { dataqueryService } from '@/_services';
import debounce from 'lodash/debounce';
import { useAppDataStore } from '@/_stores/appDataStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { runQueries } from '@/_helpers/appUtils';

const initialState = {
  dataQueries: [],
  sortBy: 'updated_at',
  sortOrder: 'asc',
  loadingDataQueries: true,
  isDeletingQueryInProcess: false,
  isCreatingQueryInProcess: false,
  isUpdatingQueryInProcess: false,
};

export const useDataQueriesStore = create(
  zustandDevTools(
    (set) => ({
      ...initialState,
      actions: {
        // TODO: Remove editor state while changing currentState
        fetchDataQueries: async (appId, selectFirstQuery = false, runQueriesOnAppLoad = false, editorRef) => {
          set({ loadingDataQueries: true });
          await dataqueryService.getAll(appId).then((data) => {
            set({
              dataQueries: data.data_queries,
              loadingDataQueries: false,
            });
            // Runs query on loading application
            if (runQueriesOnAppLoad) runQueries(data.data_queries, editorRef);
            // Compute query state to be added in the current state
            const { actions, selectedQuery } = useQueryPanelStore.getState();
            if (selectFirstQuery) {
              actions.setSelectedQuery(data.data_queries[0]?.id, data.data_queries[0]);
            } else if (selectedQuery?.id) {
              const query = data.data_queries.find((query) => query.id === selectedQuery?.id);
              actions.setSelectedQuery(query?.id);
            }
          });
        },
        setDataQueries: (dataQueries) => set({ dataQueries }),
        deleteDataQueries: (queryId) => {
          set({ isDeletingQueryInProcess: true });
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .del(queryId)
            .then(() => {
              const { actions } = useQueryPanelStore.getState();
              const { dataQueries } = useDataQueriesStore.getState();
              const newSelectedQuery = dataQueries.find((query) => query.id !== queryId);
              actions.setSelectedQuery(newSelectedQuery?.id || null);
              if (!newSelectedQuery?.id) {
                actions.setSelectedDataSource(null);
              }
              set((state) => ({
                isDeletingQueryInProcess: false,
                dataQueries: state.dataQueries.filter((query) => query.id !== queryId),
              }));
            })
            .catch(() => {
              set({
                isDeletingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        updateDataQuery: (options) => {
          set({ isUpdatingQueryInProcess: true });
          const { actions, selectedQuery } = useQueryPanelStore.getState();
          useAppDataStore.getState().actions.setIsSaving(true);
          set((state) => ({
            isUpdatingQueryInProcess: false,
            dataQueries: state.dataQueries.map((query) => {
              if (query.id === selectedQuery.id) {
                return {
                  ...query,
                  options: { ...options },
                };
              }
              return query;
            }),
          }));
          actions.setSelectedQuery(selectedQuery.id);
        },
        createDataQuery: (appId, appVersionId, options, kind, name, selectedDataSource, shouldRunQuery) => {
          set({ isCreatingQueryInProcess: true });
          const { actions, selectedQuery } = useQueryPanelStore.getState();
          const dataSourceId = selectedDataSource?.id !== 'null' ? selectedDataSource?.id : null;
          const pluginId = selectedDataSource.pluginId || selectedDataSource.plugin_id;
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .create(appId, appVersionId, name, kind, options, dataSourceId, pluginId)
            .then((data) => {
              set((state) => ({
                isCreatingQueryInProcess: false,
                dataQueries: [{ ...selectedQuery, ...data, data_source_id: dataSourceId }, ...state.dataQueries],
              }));
              actions.setSelectedQuery(data.id, data);
              if (shouldRunQuery) actions.setQueryToBeRun(data);
            })
            .catch((error) => {
              console.error('error', error);
              set({
                isCreatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        renameQuery: (id, newName) => {
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .update(id, newName)
            .then(() => {
              set((state) => ({
                dataQueries: sortByAttribute(
                  state.dataQueries.map((query) => {
                    if (query.id === id) {
                      return { ...query, name: newName };
                    }
                    return query;
                  }),
                  state.sortBy,
                  state.sortOrder
                ),
              }));
              useQueryPanelStore.getState().actions.setSelectedQuery(id);
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        changeDataQuery: (newDataSource) => {
          const { selectedQuery } = useQueryPanelStore.getState();
          set({
            isUpdatingQueryInProcess: true,
          });
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .changeQueryDataSource(selectedQuery?.id, newDataSource.id)
            .then(() => {
              set((state) => ({
                isUpdatingQueryInProcess: false,
                dataQueries: state.dataQueries.map((query) => {
                  if (query?.id === selectedQuery?.id) {
                    return { ...query, dataSourceId: newDataSource?.id };
                  }
                  return query;
                }),
              }));
              useQueryPanelStore.getState().actions.setSelectedDataSource(newDataSource);
            })
            .catch(() => {
              set({
                isUpdatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        updateDataQueryStatus: (status) => {
          set({ isUpdatingQueryInProcess: true });
          const { selectedQuery } = useQueryPanelStore.getState();
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .updateStatus(selectedQuery?.id, status)
            .then(() => {
              set((state) => ({
                isUpdatingQueryInProcess: false,
                dataQueries: state.dataQueries.map((query) => {
                  if (query.id === selectedQuery.id) {
                    return { ...query, status };
                  }
                  return query;
                }),
              }));
              useQueryPanelStore.getState().actions.setSelectedQuery(selectedQuery.id);
            })
            .catch(() => {
              set({
                isUpdatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        duplicateQuery: (id, appId) => {
          set({ isCreatingQueryInProcess: true });
          const { actions } = useQueryPanelStore.getState();
          const { dataQueries } = useDataQueriesStore.getState();
          const queryToClone = { ...dataQueries.find((query) => query.id === id) };
          let newName = queryToClone.name + '_copy';
          const names = dataQueries.map(({ name }) => name);
          let count = 0;
          while (names.includes(newName)) {
            count++;
            newName = queryToClone.name + '_copy' + count.toString();
          }
          queryToClone.name = newName;
          delete queryToClone.id;
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .create(
              appId,
              queryToClone.app_version_id,
              queryToClone.name,
              queryToClone.kind,
              queryToClone.options,
              queryToClone.data_source_id,
              queryToClone.pluginId
            )
            .then((data) => {
              set((state) => ({
                isCreatingQueryInProcess: false,
                dataQueries: [{ ...data }, ...state.dataQueries],
              }));
              actions.setSelectedQuery(data.id, { ...data });
            })
            .catch((error) => {
              console.error('error', error);
              set({
                isCreatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        saveData: debounce((newValues) => {
          set({ isUpdatingQueryInProcess: true });
          dataqueryService
            .update(newValues?.id, newValues?.name, newValues?.options)
            .then(() => {
              localStorage.removeItem('transformation');
              set(() => ({
                isUpdatingQueryInProcess: false,
              }));
            })
            .catch(() => {
              set({
                isUpdatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        }, 1000),
        sortDataQueries: (sortBy) => {
          set(({ dataQueries, sortOrder }) => ({
            sortBy,
            sortOrder: sortOrder === 'asc' ? 'desc' : 'asc',
            dataQueries: sortByAttribute(dataQueries, sortBy, sortOrder === 'asc' ? 'desc' : 'asc'),
          }));
        },
      },
    }),
    { name: 'Data Queries Store' }
  )
);

const sortByAttribute = (data, sortBy, order) => {
  if (order === 'asc') {
    return data.sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : -1));
  }
  if (order === 'desc') {
    return data.sort((a, b) => (a[sortBy] < b[sortBy] ? 1 : -1));
  }
};

export const useDataQueries = () => useDataQueriesStore((state) => state.dataQueries);
export const useDataQueriesActions = () => useDataQueriesStore((state) => state.actions);
export const useQueryCreationLoading = () => useDataQueriesStore((state) => state.isCreatingQueryInProcess);
export const useQueryUpdationLoading = () => useDataQueriesStore((state) => state.isUpdatingQueryInProcess);
