import { create, zustandDevTools } from './utils';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { useAppDataStore } from '@/_stores/appDataStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { runQueries, computeQueryState } from '@/_helpers/appUtils';
import { source } from '../Editor/QueryManager/QueryEditors';

const initialState = {
  dataQueries: [],
  loadingDataQueries: true,
  isDeletingQueryInProcess: false,
  isCreatingQueryInProcess: false,
  isUpdatingQueryInProcess: false,
};

export const useDataQueriesStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        // TODO: Remove editor state while changing currentState
        fetchDataQueries: (appId, selectFirstQuery = false, runQueriesOnAppLoad = false, editorRef) => {
          set({ loadingDataQueries: true });
          dataqueryService.getAll(appId).then((data) => {
            set({
              dataQueries: data.data_queries,
              loadingDataQueries: false,
            });
            // Runs query on loading application
            if (runQueriesOnAppLoad) runQueries(data.data_queries, editorRef);
            // Compute query state to be added in the current state
            computeQueryState(data.data_queries, editorRef);
            const { actions, selectedQuery } = useQueryPanelStore.getState();
            if (selectFirstQuery || selectedQuery?.id === 'draftQuery') {
              actions.setSelectedQuery(data.data_queries[0]?.id, data.data_queries[0]);
            } else if (selectedQuery?.id) {
              const query = data.data_queries.find((query) => query.id === selectedQuery?.id);
              actions.setSelectedQuery(query?.id);
            }
          });
        },
        setDataQueries: (dataQueries) => set({ dataQueries }),
        deleteDataQueries: (queryId, editorRef) => {
          set({ isDeletingQueryInProcess: true });
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .del(queryId)
            .then(() => {
              const { actions, selectedQuery } = useQueryPanelStore.getState();
              if (queryId === selectedQuery?.id) {
                actions.setUnSavedChanges(false);
                actions.setSelectedDataSource(null);
                actions.setSelectedQuery(null);
              }
              set((state) => ({
                isDeletingQueryInProcess: false,
                dataQueries: state.dataQueries.filter((query) => query.id !== queryId),
              }));
            })
            .catch(({ error }) => {
              set({
                isDeletingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        updateDataQuery: (options, shouldRunQuery) => {
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
                dataQueries: [{ ...selectedQuery, ...data }, ...state.dataQueries],
              }));
              actions.setSelectedQuery(data.id, data);
              if (shouldRunQuery) actions.setQueryToBeRun(data);
            })
            .catch((error) => {
              console.error('error', error);
              actions.setUnSavedChanges(false);
              set({
                isCreatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        renameQuery: (id, newName, editorRef) => {
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .update(id, newName)
            .then(() => {
              set((state) => ({
                dataQueries: state.dataQueries.map((query) => {
                  if (query.id === id) {
                    return { ...query, name: newName };
                  }
                  return query;
                }),
              }));
              useQueryPanelStore.getState().actions.setSelectedQuery(id);
            })
            .catch(({ error }) => {})
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
            .catch((error) => {
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
            .then((data) => {
              set((state) => ({
                isUpdatingQueryInProcess: false,
                dataQueries: state.dataQueries.map((query) => {
                  if (query.id === data.id) {
                    return { ...query, status: data.status };
                  }
                  return query;
                }),
              }));
              useQueryPanelStore.getState().actions.setSelectedQuery(data.id);
            })
            .catch(({ error }) => {
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
              actions.setUnSavedChanges(false);
              // toast.success('Query Added');
              set((state) => ({
                isCreatingQueryInProcess: false,
                dataQueries: [{ ...data }, ...state.dataQueries],
              }));
              actions.setSelectedQuery(data.id, { ...data });
            })
            .catch((error) => {
              console.error('error', error);
              actions.setUnSavedChanges(false);
              set({
                isCreatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        saveData: debounce((newValues) => {
          set({ isUpdatingQueryInProcess: true });
          const { actions } = useQueryPanelStore.getState();
          dataqueryService
            .update(newValues?.id, newValues?.name, newValues?.options)
            .then((data) => {
              actions.setUnSavedChanges(false);
              localStorage.removeItem('transformation');
              set((state) => ({
                isUpdatingQueryInProcess: false,
              }));
            })
            .catch(({ error }) => {
              actions.setUnSavedChanges(false);
              set({
                isUpdatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        }, 1000),
      },
    }),
    { name: 'Data Queries Store' }
  )
);

useQueryPanelStore.subscribe(({ selectedQuery }, prevState) => {
  console.log(
    'CHANGES ->',
    isEqual(selectedQuery, prevState?.selectedQuery),
    selectedQuery?.options,
    prevState?.selectedQuery?.options
  );
  if (!isEqual(selectedQuery, prevState?.selectedQuery)) {
    useDataQueriesStore.getState().actions.saveData(selectedQuery);
  } else {
    useAppDataStore.getState().actions.setIsSaving(false);
  }
});

export const useDataQueries = () => useDataQueriesStore((state) => state.dataQueries);
export const useDataQueriesActions = () => useDataQueriesStore((state) => state.actions);
export const useQueryCreationLoading = () => useDataQueriesStore((state) => state.isCreatingQueryInProcess);
export const useQueryUpdationLoading = () => useDataQueriesStore((state) => state.isUpdatingQueryInProcess);
