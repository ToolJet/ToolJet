import type { StoreApi, UseBoundStore } from 'zustand';

import { createZustandStoreWithImmer } from '@/_stores/utils';

import type {
  AppsStoreCreator,
  IAppDialogState,
  IAppsStore,
  IAppsStoreInitialState,
  IFolderDialogState,
} from './types/appsStore';

const folderDialogInitialState: IFolderDialogState = {
  type: '',
  appDetails: null,
  folderId: '',
  initialFolderName: '',
  selectedRowIds: [],
};

const appDialogInitialState: IAppDialogState = {
  type: '',
  appDetails: null,
  selectedRowIds: [],
};

const initialState: IAppsStoreInitialState = {
  currentPage: 1,
  switchBranchModal: { open: false, postSwitchAction: '' },
  appDialogState: { ...appDialogInitialState },
  folderDialogState: { ...folderDialogInitialState },
  openSwitchBranchModal: false,
};

const createAppsStore: AppsStoreCreator = (set) => ({
  ...initialState,
  setCurrentPage: (page) =>
    set(
      (state) => {
        state.currentPage = page;
      },
      false,
      'setCurrentPage'
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
  toggleSwitchBranchModal: (updatedState) =>
    set(
      (state) => {
        state.switchBranchModal = updatedState;
      },
      false,
      'toggleSwitchBranchModal'
    ),
});

// For apps, workflow and module list page
export const useAppsStore: UseBoundStore<StoreApi<IAppsStore>> = createZustandStoreWithImmer(createAppsStore, {
  storeName: 'Apps store',
});
