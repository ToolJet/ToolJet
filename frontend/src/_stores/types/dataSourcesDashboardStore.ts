import type { StateCreator } from 'zustand';
import type { RowSelectionState, Updater } from '@tanstack/react-table';

export type DataSourceFolderDialogType =
  '' | 'create-folder' | 'rename-folder' | 'delete-folder' | 'folder-has-data-sources-warning';

export interface IDataSourceFolderDialogState {
  /** Empty = no folder dialog is open. */
  type: DataSourceFolderDialogType;
  folderDetails: { id: string; name: string } | null;
  /** Branches that still hold data sources of the folder; set when a delete is refused. */
  folderHasItemsOnBranch: string[];
}

export interface IDataSourcesDashboardStore {
  folderDialogState: IDataSourceFolderDialogState;
  setFolderDialogState: (updatedState: Partial<IDataSourceFolderDialogState>) => void;
  resetFolderDialogState: () => void;
  /** TanStack selection keyed by row id (`data_source:<id>` / `folder:<id>`), shared by the root and folder tables. */
  rowSelection: RowSelectionState;
  /** Takes a value or an updater, matching TanStack's `onRowSelectionChange`. */
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  clearSelection: () => void;
}

export type IDataSourcesDashboardStoreInitialState = Pick<
  IDataSourcesDashboardStore,
  'folderDialogState' | 'rowSelection'
>;

// Mirrors createZustandStoreWithImmer, which wraps the creator as devtools(immer(...)).
export type DataSourcesDashboardStoreCreator = StateCreator<
  IDataSourcesDashboardStore,
  [['zustand/devtools', never], ['zustand/immer', never]]
>;
