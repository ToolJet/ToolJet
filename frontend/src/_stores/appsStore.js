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
  pageSize: 12,
  currentPage: 1,
  appDialogState: { ...appDialogInitialState },
  folderDialogState: { ...folderDialogInitialState },
  openSwitchBranchModal: false,
  currentFolderDetails: null,
};

// For apps, workflow and module list page
export const useAppsStore = createZustandStoreWithImmer(
  (set) => ({
    ...initialState,
    setCurrentPage: (page) =>
      set(
        (state) => {
          state.currentPage = page;
        },
        false,
        'setCurrentPage'
      ),
    setPageSize: (size) =>
      set(
        (state) => {
          state.pageSize = size;
        },
        false,
        'setPageSize'
      ),
    setAppDialogState: (updatedState) =>
      set(
        (state) => {
          state.appDialogState = { ...state.appDialogState, ...updatedState };
        },
        false,
        'setAppDialogState'
      ),
    resetAppDialogState: () =>
      set(
        (state) => {
          state.appDialogState = { ...appDialogInitialState };
        },
        false,
        'resetAppDialogState'
      ),
    setFolderDialogState: (updatedState) =>
      set(
        (state) => {
          state.folderDialogState = { ...state.folderDialogState, ...updatedState };
        },
        false,
        'setFolderDialogState'
      ),
    resetFolderDialogState: () =>
      set(
        (state) => {
          state.folderDialogState = { ...folderDialogInitialState };
        },
        false,
        'resetFolderDialogState'
      ),
    setOpenSwitchBranchModal: (isOpen) =>
      set(
        (state) => {
          state.openSwitchBranchModal = isOpen;
        },
        false,
        'setOpenSwitchBranchModal'
      ),
    setCurrentFolderDetails: (details) =>
      set(
        (state) => {
          state.currentFolderDetails = details;
        },
        false,
        'setCurrentFolderDetails'
      ),
  }),
  { storeName: 'Apps store' }
);
