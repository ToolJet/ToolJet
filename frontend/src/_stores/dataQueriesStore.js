import { create } from 'zustand';
import { zustandDevTools } from './utils';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';

import { useAppDataStore } from '@/_stores/appDataStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { runQueries, computeQueryState } from '@/_helpers/appUtils';

export const useDataQueriesStore = create(
  zustandDevTools((set, get) => ({
    dataQueries: [],
    loadingDataQueries: true,
    isDeletingQueryInProcess: false,
    isCreatingQueryInProcess: false,
    isUpdatingQueryInProcess: false,
    actions: {
      // TODO: Remove editor state while refactoring QueryManager
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
        dataqueryService
          .del(queryId)
          .then(() => {
            toast.success('Query Deleted');
            set({
              isDeletingQueryInProcess: false,
            });
            const { actions, selectedQuery } = useQueryPanelStore.getState();
            if (queryId === selectedQuery?.id) {
              actions.setUnSavedChanges(false);
              actions.setSelectedQuery(null);
            }
            get().actions.fetchDataQueries(
              useAppDataStore.getState().editingVersion?.id,
              selectedQuery?.id === queryId,
              false,
              editorRef
            );
          })
          .catch(({ error }) => {
            set({
              isDeletingQueryInProcess: false,
            });
            toast.error(error);
          });
      },
      updateDataQuery: (options, shouldRunQuery) => {
        set({ isUpdatingQueryInProcess: true });
        const { actions, selectedQuery } = useQueryPanelStore.getState();
        dataqueryService
          .update(selectedQuery?.id, selectedQuery?.name, options)
          .then((data) => {
            // this.props.dataQueriesChanged();
            actions.setUnSavedChanges(false);
            localStorage.removeItem('transformation');
            toast.success('Query Saved');
            if (shouldRunQuery) actions.setQueryToBeRun();
          })
          .catch(({ error }) => {
            this.setState({
              isUpdating: false,
              isFieldsChanged: false,
              restArrayValuesChanged: false,
            });
            this.setUnsavedQueryChanges(false);
            toast.error(error);
          });
      },
      renameQuery: (id, newName, fetchDataQueries) => {
        dataqueryService
          .update(id, newName)
          .then(() => {
            toast.success('Query Name Updated');
            fetchDataQueries(useAppDataStore.getState().editingVersion?.id); // Should be replaced with - get().actions.fetchDataQueries(useAppDataStore.getState().editingVersion?.id);
          })
          .catch(({ error }) => {
            toast.error(error);
          });
      },
    },
  }))
);

export const useDataQueries = () => useDataQueriesStore((state) => state.dataQueries);
export const useDataQueriesActions = () => useDataQueriesStore((state) => state.actions);
