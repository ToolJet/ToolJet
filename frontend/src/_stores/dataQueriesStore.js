import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { dataqueryService } from '@/_services';
import { useAppDataStore } from '@/_stores/appDataStore';
import { toast } from 'react-hot-toast';

export const useDataQueriesStore = create(
  devtools((set, get) => ({
    dataQueries: [],
    loadingDataQueries: true,
    isDeletingQueryInProcess: false,
    selectedQuery: null,
    actions: {
      fetchDataQueries: (appId) => {
        set({ loadingDataQueries: true });
        dataqueryService.getAll(appId).then((data) => {
          set({
            dataQueries: data.data_queries,
            loadingDataQueries: false,
          });
        });
      },
      deleteDataQueries: (queryId) => {
        set({ isDeletingQueryInProcess: true });
        dataqueryService
          .del(queryId)
          .then(() => {
            toast.success('Query Deleted');
            set({
              isDeletingQueryInProcess: false,
            });
            get().actions.fetchDataQueries(useAppDataStore.getState().editingVersion?.id);
          })
          .catch(({ error }) => {
            set({
              isDeletingQueryInProcess: false,
            });
            toast.error(error);
          });
      },
      renameQuery: (id, newName) => {
        dataqueryService
          .update(id, newName)
          .then(() => {
            toast.success('Query Name Updated');
            get().actions.fetchDataQueries(useAppDataStore.getState().editingVersion?.id);
          })
          .catch(({ error }) => {
            toast.error(error);
          });
      },
      setSelectedQuery: (queryId) => {
        set((state) => {
          const query = state.dataQueries.find((query) => query.id === queryId);
          return { selectedQuery: query };
        });
      },
    },
  }))
);

export const useDataQueries = () => useDataQueriesStore((state) => state.dataQueries);
export const useSelectedQuery = () => useDataQueriesStore((state) => state.selectedQuery);
export const useDataQueriesActions = () => useDataQueriesStore((state) => state.actions);
