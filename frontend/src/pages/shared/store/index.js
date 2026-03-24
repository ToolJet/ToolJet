import { createZustandStoreWithImmer } from '@/_stores/utils';

const folderDialogInitialState = {
  type: '',
  appDetails: null,
  currentFolderId: '',
  initialFolderName: '',
};

const appDialogInitialState = {
  type: '',
  appDetails: null,
};

const initialState = {
  pageSize: 9,
  currentPage: 1,
  appSearchQuery: '',
  appDialogState: { ...appDialogInitialState },
  folderDialogState: { ...folderDialogInitialState },
};

// For apps, workflow and module list page
export const useAppsStore = createZustandStoreWithImmer(
  (set) => ({
    ...initialState,
    setCurrentPage: (page) =>
      set((state) => {
        state.currentPage = page;
      }),
    setAppSearchQuery: (query) =>
      set((state) => {
        state.appSearchQuery = query;
      }),
    setPageSize: (size) =>
      set((state) => {
        state.pageSize = size;
      }),
    setAppDialogState: (updatedState) =>
      set((state) => {
        state.appDialogState = { ...state.appDialogState, ...updatedState };
      }),
    resetAppDialogState: () =>
      set((state) => {
        state.appDialogState = { ...appDialogInitialState };
      }),
    setFolderDialogState: (updatedState) =>
      set((state) => {
        state.folderDialogState = { ...state.folderDialogState, ...updatedState };
      }),
    resetFolderDialogState: () =>
      set((state) => {
        state.folderDialogState = { ...folderDialogInitialState };
      }),
  }),
  { storeName: 'Apps store' }
);
