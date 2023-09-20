import { create, zustandDevTools } from './utils';

import { useDataQueriesStore } from '@/_stores/dataQueriesStore';

const queryManagerPreferences = JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {};
const initialState = {
  queryPanelHeight: queryManagerPreferences?.isExpanded ? queryManagerPreferences?.queryPanelHeight : 95 ?? 70,
  selectedQuery: null,
  selectedDataSource: null,
  queryToBeRun: null,
  previewLoading: false,
  queryPreviewData: '',
  showCreateQuery: false,
  nameInputFocussed: false,
};

export const useQueryPanelStore = create(
  zustandDevTools(
    (set) => ({
      ...initialState,
      actions: {
        updateQueryPanelHeight: (newHeight) => set(() => ({ queryPanelHeight: newHeight })),
        setSelectedQuery: (queryId) => {
          set(() => {
            if (queryId === null) {
              return { selectedQuery: null };
            }
            const query = useDataQueriesStore.getState().dataQueries.find((query) => query.id === queryId);
            return { selectedQuery: query };
          });
        },
        setSelectedDataSource: (dataSource = null) => set({ selectedDataSource: dataSource }),
        setQueryToBeRun: (query) => set({ queryToBeRun: query }),
        setPreviewLoading: (status) => set({ previewLoading: status }),
        setPreviewData: (data) => set({ queryPreviewData: data }),
        setShowCreateQuery: (showCreateQuery) => set({ showCreateQuery }),
        setNameInputFocussed: (nameInputFocussed) => set({ nameInputFocussed }),
      },
    }),
    { name: 'Query Panel Store' }
  )
);

export const usePanelHeight = () => useQueryPanelStore((state) => state.queryPanelHeight);
export const useSelectedQuery = () => useQueryPanelStore((state) => state.selectedQuery);
export const useSelectedDataSource = () => useQueryPanelStore((state) => state.selectedDataSource);
export const useQueryToBeRun = () => useQueryPanelStore((state) => state.queryToBeRun);
export const usePreviewLoading = () => useQueryPanelStore((state) => state.previewLoading);
export const usePreviewData = () => useQueryPanelStore((state) => state.queryPreviewData);
export const useQueryPanelActions = () => useQueryPanelStore((state) => state.actions);
export const useShowCreateQuery = () =>
  useQueryPanelStore((state) => [state.showCreateQuery, state.actions.setShowCreateQuery]);
export const useNameInputFocussed = () =>
  useQueryPanelStore((state) => [state.nameInputFocussed, state.actions.setNameInputFocussed]);
