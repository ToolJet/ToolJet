import type { StoreApi, UseBoundStore } from 'zustand';

import { createZustandStoreWithImmer } from '@/_stores/utils';
import { useWorkspaceBranchesStore } from './workspaceBranchesStore';

import type {
  AppsStoreCreator,
  IAppDialogState,
  IAppsStore,
  IAppsStoreInitialState,
  IFolderDialogState,
} from './types/appsStore';
import { isWorkspaceBranchLocked } from '@/pages/AppsDashboard/helper';

const folderDialogInitialState: IFolderDialogState = {
  type: '',
  appDetails: null,
  folderDetails: null,
  folderId: '',
  folderHasItemsOnBranch: [],
};

const appDialogInitialState: IAppDialogState = {
  type: '',
  appDetails: null,
};

const initialState: IAppsStoreInitialState = {
  currentPage: 1,
  switchBranchModal: { open: false, postSwitchActionDetails: null },
  appDialogState: { ...appDialogInitialState },
  folderDialogState: { ...folderDialogInitialState },
  expanded: {},
  rowSelection: {},
};

const createAppsStore: AppsStoreCreator = (set, get) => ({
  ...initialState,
  setCurrentPage: (page) =>
    set(
      (state) => {
        state.currentPage = page;
      },
      false,
      'setCurrentPage'
    ),
  // Updaters run on `get()` outside `set`, so TanStack's updater functions never receive an Immer draft.
  setExpanded: (updater) => {
    const expanded = typeof updater === 'function' ? updater(get().expanded) : updater;
    set(
      (state) => {
        state.expanded = expanded;
      },
      false,
      'setExpanded'
    );
  },
  setRowSelection: (updater) => {
    const rowSelection = typeof updater === 'function' ? updater(get().rowSelection) : updater;
    set(
      (state) => {
        state.rowSelection = rowSelection;
      },
      false,
      'setRowSelection'
    );
  },
  clearSelection: () =>
    set(
      (state) => {
        state.rowSelection = {};
      },
      false,
      'clearSelection'
    ),
  setAppDialogState: (updatedState) => {
    if (!updatedState.type) return;

    const { isInitialized, orgGitConfig, currentBranch } = useWorkspaceBranchesStore.getState();

    const isBranchLocked = isWorkspaceBranchLocked({
      isInitialized,
      orgGitConfig,
      currentBranch,
      app: updatedState.appDetails,
    });

    set(
      (state) => {
        if (isBranchLocked) {
          state.switchBranchModal = {
            open: true,
            postSwitchActionDetails: updatedState,
          };
          console.log('Branch is locked, cannot open app dialog');
          return;
        }

        state.appDialogState = { ...state.appDialogState, ...updatedState };
      },
      false,
      'setAppDialogState'
    );
  },
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
