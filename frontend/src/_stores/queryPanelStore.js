import { cloneDeep } from 'lodash';
import { create, zustandDevTools } from './utils';

import { useDataQueriesStore } from '@/_stores/dataQueriesStore';

const queryManagerPreferences = JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {};
const initialState = {
  queryPanelHeight: queryManagerPreferences?.isExpanded ? queryManagerPreferences?.queryPanelHeight : 95 ?? 70,
  selectedQuery: null,
  selectedDataSource: null,
  isUnsavedChangesAvailable: false,
  queryToBeRun: null,
  previewLoading: false,
  queryPreviewData: null,
};

export const useQueryPanelStore = create(
  zustandDevTools(
    (set) => ({
      ...initialState,
      actions: {
        updateQueryPanelHeight: (newHeight) => set(() => ({ queryPanelHeight: newHeight })),
        setSelectedQuery: (queryId, dataQuery = {}) => {
          set((state) => {
            if (queryId === null) {
              return { selectedQuery: null };
            }
            const query = useDataQueriesStore.getState().dataQueries.find((query) => query.id === queryId);
            return { selectedQuery: query ? cloneDeep(query) : null };
          });
        },
        setSelectedDataSource: (dataSource = null) => set({ selectedDataSource: dataSource }),
        setUnSavedChanges: (value) => set({ isUnsavedChangesAvailable: value }),
        setQueryToBeRun: (query) => set({ queryToBeRun: query }),
        setPreviewLoading: (status) => set({ previewLoading: status }),
        setPreviewData: (data) => set({ queryPreviewData: data }),
      },
    }),
    { name: 'Query Panel Store' }
  )
);

export const usePanelHeight = () => useQueryPanelStore((state) => state.queryPanelHeight);
export const useSelectedQuery = () => useQueryPanelStore((state) => state.selectedQuery);
export const useSelectedDataSource = () => useQueryPanelStore((state) => state.selectedDataSource);
export const useUnsavedChanges = () => useQueryPanelStore((state) => state.isUnsavedChangesAvailable);
export const useQueryToBeRun = () => useQueryPanelStore((state) => state.queryToBeRun);
export const usePreviewLoading = () => useQueryPanelStore((state) => state.previewLoading);
export const usePreviewData = () => useQueryPanelStore((state) => state.queryPreviewData);
export const useQueryPanelActions = () => useQueryPanelStore((state) => state.actions);
