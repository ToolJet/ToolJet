import type { StateCreator } from 'zustand';

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
  | 'import-from-git'
  | 'bulk-delete';

export type FolderDialogType =
  | ''
  | 'create-folder'
  | 'rename-folder'
  | 'delete-folder'
  | 'add-to-folder'
  | 'remove-app-from-folder'
  | 'bulk-delete-folder';

// Carries either an existing app (id, name, type, icon) or an import in progress (file and plugin fields).
export interface IAppDetails {
  id?: string;
  name?: string;
  type?: 'front-end' | 'module' | 'workflow';
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
  /** Row ids (`app:<id>` / `folder:<id>`) a bulk dialog acts on. */
  selectedRowIds?: string[];
}

export interface IFolderDialogState {
  type: FolderDialogType;
  appDetails: IAppDetails | null;
  folderId: string;
  initialFolderName: string;
  /** Row ids (`app:<id>` / `folder:<id>`) a bulk dialog acts on. */
  selectedRowIds?: string[];
}

export interface ISwitchBranchModal {
  open: boolean;
  postSwitchAction: AppDialogType | FolderDialogType;
}

export interface IAppsStore {
  currentPage: number;
  switchBranchModal: ISwitchBranchModal;
  appDialogState: IAppDialogState;
  folderDialogState: IFolderDialogState;
  openSwitchBranchModal: boolean;
  setCurrentPage: (page: number) => void;
  setAppDialogState: (updatedState: Partial<IAppDialogState>) => void;
  resetAppDialogState: () => void;
  setFolderDialogState: (updatedState: Partial<IFolderDialogState>) => void;
  resetFolderDialogState: () => void;
  toggleSwitchBranchModal: (updatedState: ISwitchBranchModal) => void;
}

// Annotating the initial state keeps literals like `postSwitchAction: ''` on their union type instead of widening to string.
export type IAppsStoreInitialState = Pick<
  IAppsStore,
  'currentPage' | 'switchBranchModal' | 'appDialogState' | 'folderDialogState' | 'openSwitchBranchModal'
>;

// Mirrors createZustandStoreWithImmer, which wraps the creator as devtools(immer(...)).
export type AppsStoreCreator = StateCreator<IAppsStore, [['zustand/devtools', never], ['zustand/immer', never]]>;
