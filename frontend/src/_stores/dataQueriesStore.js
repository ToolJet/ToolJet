import { create, zustandDevTools } from './utils';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';

import { useAppDataStore } from '@/_stores/appDataStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { runQueries, computeQueryState } from '@/_helpers/appUtils';

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
              // toast.success('Query Deleted');
              const { actions, selectedQuery } = useQueryPanelStore.getState();
              if (queryId === selectedQuery?.id) {
                actions.setUnSavedChanges(false);
                actions.setSelectedQuery(null);
              }
              set((state) => ({
                isDeletingQueryInProcess: false,
                dataQueries: state.dataQueries.filter((query) => query.id !== queryId),
              }));

              // get().actions.fetchDataQueries(
              //   useAppDataStore.getState().editingVersion?.id,
              //   selectedQuery?.id === queryId,
              //   false,
              //   editorRef
              // );
            })
            .catch(({ error }) => {
              set({
                isDeletingQueryInProcess: false,
              });
              // toast.error(error);
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        updateDataQuery: (options, shouldRunQuery) => {
          set({ isUpdatingQueryInProcess: true });
          const { actions, selectedQuery } = useQueryPanelStore.getState();
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .update(selectedQuery?.id, selectedQuery?.name, options)
            .then((data) => {
              actions.setUnSavedChanges(false);
              localStorage.removeItem('transformation');
              // toast.success('Query Saved');
              set((state) => ({
                isUpdatingQueryInProcess: false,
                dataQueries: state.dataQueries.map((query) => {
                  if (query.id === data.id) {
                    return { ...query, ...data };
                  }
                  return query;
                }),
              }));
              actions.setSelectedQuery(data.id);
              if (shouldRunQuery) actions.setQueryToBeRun(data);
            })
            .catch(({ error }) => {
              actions.setUnSavedChanges(false);
              // toast.error(error);
              set({
                isUpdatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        createDataQuery: (appId, appVersionId, options, shouldRunQuery) => {
          set({ isCreatingQueryInProcess: true });
          const { actions, selectedQuery, selectedDataSource } = useQueryPanelStore.getState();
          const { name, kind } = selectedQuery;
          const dataSourceId =
            selectedDataSource?.id && selectedDataSource?.id !== 'null' ? selectedDataSource?.id : null;
          const pluginId = selectedDataSource.pluginId || selectedDataSource.plugin_id;
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .create(appId, appVersionId, name, kind, options, dataSourceId, pluginId)
            .then((data) => {
              actions.setUnSavedChanges(false);
              // toast.success('Query Added');
              set((state) => ({
                isCreatingQueryInProcess: false,
                dataQueries: [{ ...selectedQuery, ...data }, ...state.dataQueries],
              }));
              actions.setSelectedQuery(data.id, { ...selectedQuery, id: data.id });
              if (shouldRunQuery) actions.setQueryToBeRun(data);
            })
            .catch((error) => {
              console.error('error', error);
              actions.setUnSavedChanges(false);
              // toast.error(error.message);
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
              // toast.success('Query Name Updated');
              // get().actions.fetchDataQueries(useAppDataStore.getState().editingVersion?.id, false, false, editorRef);
              set((state) => ({
                dataQueries: state.dataQueries.map((query) => {
                  if (query.id === id) {
                    return { ...query, name: newName };
                  }
                  return query;
                }),
              }));
            })
            .catch(({ error }) => {
              // toast.error(error);
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        changeDataQuery: (newDataSource) => {
          const { selectedQuery } = useQueryPanelStore.getState();
          set({
            isUpdatingQueryInProcess: true,
          });
          dataqueryService
            .changeQueryDataSource(selectedQuery?.id, newDataSource.id)
            .then(() => {
              set({
                isUpdatingQueryInProcess: false,
              });
              toast.success('Data source changed');
            })
            .catch((error) => {
              toast.error(error);
              set({
                isUpdatingQueryInProcess: false,
              });
            });
        },
        updateDataQueryStatus: (status) => {
          set({ isUpdatingQueryInProcess: true });
          const { selectedQuery } = useQueryPanelStore.getState();
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .updateStatus(selectedQuery?.id, status)
            .then((data) => {
              // toast.success('Query Published');
              set((state) => ({
                isUpdatingQueryInProcess: false,
                dataQueries: state.dataQueries.map((query) => {
                  if (query.id === data.id) {
                    return { ...query, status: data.status };
                  }
                  return query;
                }),
              }));
            })
            .catch(({ error }) => {
              // toast.error(error);
              set({
                isUpdatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
      },
    }),
    { name: 'Data Queries Store' }
  )
);

export const useDataQueries = () => useDataQueriesStore((state) => state.dataQueries);
export const useDataQueriesActions = () => useDataQueriesStore((state) => state.actions);
export const useQueryCreationLoading = () => useDataQueriesStore((state) => state.isCreatingQueryInProcess);
export const useQueryUpdationLoading = () => useDataQueriesStore((state) => state.isUpdatingQueryInProcess);
