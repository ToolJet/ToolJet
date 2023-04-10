import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { useDataQueriesStore } from '@/_stores/dataQueriesStore';

const queryManagerPreferences = JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {};

export const useQueryPanelStore = create(
  devtools((set) => ({
    queryPanelHeight: queryManagerPreferences?.isExpanded ? queryManagerPreferences?.queryPanelHeight : 95 ?? 70,
    selectedQuery: null,
    isUnsavedChangesAvailable: false,
    actions: {
      updateQueryPanelHeight: (newHeight) => set(() => ({ queryPanelHeight: newHeight })),
      setSelectedQuery: (queryId, dataQuery = {}) => {
        set(() => {
          if (queryId === null) {
            return { selectedQuery: null };
          } else if (queryId === 'draftQuery') {
            return { selectedQuery: dataQuery };
          }
          const query = useDataQueriesStore.getState().dataQueries.find((query) => query.id === queryId);
          return { selectedQuery: query };
        });
      },
      setUnSavedChanges: (value) => set({ isUnsavedChangesAvailable: value }),
    },
  }))
);

export const usePanelHeight = () => useQueryPanelStore((state) => state.queryPanelHeight);
export const useSelectedQuery = () => useQueryPanelStore((state) => state.selectedQuery);
export const useUnsavedChanges = () => useQueryPanelStore((state) => state.isUnsavedChangesAvailable);
export const useQueryPanelActions = () => useQueryPanelStore((state) => state.actions);
