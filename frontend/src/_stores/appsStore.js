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
  appDialogState: { ...appDialogInitialState },
  folderDialogState: { ...folderDialogInitialState },
  openSwitchBranchModal: false,
};

// For apps, workflow and module list page
export const useAppsStore = createZustandStoreWithImmer(
  (set) => ({
    ...initialState,
    setCurrentPage: (page) =>
      set((state) => {
        state.currentPage = page;
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
    setOpenSwitchBranchModal: (isOpen) =>
      set((state) => {
        state.openSwitchBranchModal = isOpen;
      }),
    //  TODO: Might need to reset store on page change as its used across multiple pages
  }),
  { storeName: 'Apps store' }
);
