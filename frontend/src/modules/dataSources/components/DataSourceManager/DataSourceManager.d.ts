// Types for DataSourceManager.jsx, which TS can't infer through its HOC chain (withTranslation/withRouter/withStore).
// Delete this file once DataSourceManager is converted to TypeScript.
import type { ComponentType, ReactNode } from 'react';

export interface DataSourceEnvironment {
  id: string;
  name: string;
  priority?: number;
}

export interface DataSourceManagerDataSource {
  id: string;
  name: string;
  kind?: string;
  isSynced?: boolean;
  is_synced?: boolean;
  options?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DataSourceTestConnectionProps {
  kind?: string;
  pluginId?: string;
  options: Record<string, unknown>;
  onConnectionTestFailed: (error: unknown) => void;
  environmentId?: string;
  dataSourceId?: string;
  dataSourceType?: string;
  appId?: string;
}

/** What the form hands to `renderPageHeader` when it renders in `pageLayout` mode. */
export interface DataSourcePageHeaderContext {
  dataSourceId: string;
  icon: ReactNode;
  name: string;
  isDummy: boolean;
  dummyMessage: string;
  isNameDisabled: boolean;
  onNameChange: (name: string) => void;
  docLink: string;
  isSampleDb: boolean;
  /** Empty for sample data sources. */
  environments: Array<DataSourceEnvironment & { enabled?: boolean }>;
  currentEnvironment?: DataSourceEnvironment | null;
  onEnvironmentChange: (environment: DataSourceEnvironment) => void;
  /** Null when the data source has no test-connection action. */
  testConnectionProps: DataSourceTestConnectionProps | null;
  /** Null when the data source can't be saved. */
  onSave: (() => void) | null;
  isSaving: boolean;
  isSaveDisabled: boolean;
}

/** Props used by the global (workspace) data source pages. App Builder-only props are omitted. */
export interface DataSourceManagerProps {
  scope: 'global' | 'local';
  /** Renders the form on a page instead of in a modal; the page draws the header through `renderPageHeader`. */
  pageLayout?: boolean;
  /** Header element that hosts actions of forms with their own save/connect buttons (OAuth, SharePoint). */
  pageActionsSlot?: HTMLElement | null;
  renderPageHeader?: (context: DataSourcePageHeaderContext) => ReactNode;
  selectedDataSource: DataSourceManagerDataSource | null;
  /** Modal mode only. */
  showDataSourceManagerModal?: boolean;
  /** Called after save (success or failure) and on close; the form clears its own state first. */
  hideModal: (dataSource?: unknown) => void;
  dataSourcesChanged: (resetSelection: boolean, dataSource: unknown) => void;
  darkMode?: boolean;
  environments?: DataSourceEnvironment[];
  currentEnvironment?: DataSourceEnvironment | null;
  environmentChanged?: (environment: DataSourceEnvironment, dataSourceId?: string) => void;
  environmentLoading?: boolean;
  featureAccess?: Record<string, unknown>;
  /** Element the react-bootstrap modal portals into. */
  container?: HTMLElement | null;
  /** Spread onto the react-bootstrap `Modal`. */
  modalProps?: Record<string, unknown>;
  isEditing?: boolean;
  showBackButton?: boolean;
  showSaveBtn?: boolean;
  isWorkspaceBranchLocked?: boolean;
  updateSelectedDatasource?: (name: string) => void;
}

export declare const DataSourceManager: ComponentType<DataSourceManagerProps>;
