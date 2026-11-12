import type { StateCreator } from 'zustand';
import type { ExpandedState, RowSelectionState, Updater } from '@tanstack/react-table';
// '' means no dialog is open.
export type AppDialogType =
  | ''
  | 'create'
  | 'create-from-template'
  | 'choose-from-template'
  | 'rename'
  | 'duplicate'
  | 'delete'
  | 'export'
  | 'change-icon'
  | 'import'
  | 'import-anyway'
  | 'import-from-git';

export type FolderDialogType =
  | ''
  | 'create-folder'
  | 'rename-folder'
  | 'delete-folder'
  | 'folder-has-apps-warning'
  | 'add-to-folder'
  | 'remove-app-from-folder';

type TAppType = 'front-end' | 'module' | 'workflow';

// Carries either an existing app (id, name, type, icon) or an import in progress (file and plugin fields).
export interface IAppDetails {
  id?: string;
  name?: string;
  type?: TAppType;
  icon?: string;
  fileName?: string;
  fileContent?: unknown;
  dependentPlugins?: unknown[];
  dependentPluginsDetail?: Record<string, unknown>;
  missingGroups?: unknown[];
}

export interface IAppDialogState {
  type: AppDialogType;
  appDetails: IAppDetails | null;
}

export interface IFolderDialogState {
  type: FolderDialogType;
  appDetails: IAppDetails | null;
  folderDetails: { id: string; name: string } | null;
  folderId: string;
  folderHasItemsOnBranch?: string[];
}

export interface ISwitchBranchModal {
  open: boolean;
  postSwitchActionDetails?: Partial<IAppDialogState> | null;
}

export interface IAppsStore {
  currentPage: number;
  switchBranchModal: ISwitchBranchModal;
  appDialogState: IAppDialogState;
  folderDialogState: IFolderDialogState;
  /** List view folders that are open, keyed by row id (`folder:<id>`). */
  expanded: ExpandedState;
  /** List view selection, keyed by row id (`app:<id>` / `folder:<id>`); shared by the root and every folder table. */
  rowSelection: RowSelectionState;
  setCurrentPage: (page: number) => void;
  setExpanded: (updater: Updater<ExpandedState>) => void;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  clearSelection: () => void;
  // skipBranchLockCheck opens the dialog even when the branch is locked, e.g. right after the user switched branches.
  setAppDialogState: (updatedState: Partial<IAppDialogState>, skipBranchLockCheck?: boolean) => void;
  resetAppDialogState: () => void;
  setFolderDialogState: (updatedState: Partial<IFolderDialogState>) => void;
  resetFolderDialogState: () => void;
  toggleSwitchBranchModal: (updatedState: ISwitchBranchModal) => void;
}

export type IAppsStoreInitialState = Pick<
  IAppsStore,
  'currentPage' | 'switchBranchModal' | 'appDialogState' | 'folderDialogState' | 'expanded' | 'rowSelection'
>;

// Mirrors createZustandStoreWithImmer, which wraps the creator as devtools(immer(...)).
export type AppsStoreCreator = StateCreator<IAppsStore, [['zustand/devtools', never], ['zustand/immer', never]]>;
