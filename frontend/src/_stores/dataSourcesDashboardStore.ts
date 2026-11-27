import type { StoreApi, UseBoundStore } from 'zustand';

import { createZustandStoreWithImmer } from '@/_stores/utils';

import type {
  DataSourcesDashboardStoreCreator,
  IDataSourceFolderDialogState,
  IDataSourcesDashboardStore,
  IDataSourcesDashboardStoreInitialState,
} from './types/dataSourcesDashboardStore';

const folderDialogInitialState: IDataSourceFolderDialogState = {
  type: '',
  folderDetails: null,
  folderHasItemsOnBranch: [],
};

const initialState: IDataSourcesDashboardStoreInitialState = {
  folderDialogState: { ...folderDialogInitialState },
  rowSelection: {},
};

const createDataSourcesDashboardStore: DataSourcesDashboardStoreCreator = (set, get) => ({
  ...initialState,
  setFolderDialogState: (updatedState) => {
    set((state) => {
      state.folderDialogState = { ...state.folderDialogState, ...updatedState };
    });
  },
  resetFolderDialogState: () => {
    set((state) => {
      state.folderDialogState = { ...folderDialogInitialState };
    });
  },
  // The updater runs on `get()` outside `set`, so TanStack's updater functions never receive an Immer draft.
  setRowSelection: (updater) => {
    const rowSelection = typeof updater === 'function' ? updater(get().rowSelection) : updater;
    set((state) => {
      state.rowSelection = rowSelection;
    });
  },
  clearSelection: () => {
    set((state) => {
      state.rowSelection = {};
    });
  },
});

// UI state shared across the data sources dashboard (list page), e.g. which dialog is open.
// Not `dataSourcesStore`: that one holds the App Builder's data sources.
export const useDataSourcesDashboardStore: UseBoundStore<StoreApi<IDataSourcesDashboardStore>> =
  createZustandStoreWithImmer(createDataSourcesDashboardStore, { storeName: 'Data sources dashboard store' });
