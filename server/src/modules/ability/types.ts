import { MODULES } from '@modules/app/constants/modules';

export interface ResourcePermissionQueryObject {
  resources?: ResourcesItem[];
  organizationId: string;
}

export interface ResourcesItem {
  resource: MODULES;
  resourceId?: string;
}

export interface UserPermissions {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isBuilder: boolean;
  isEndUser: boolean;
  appCreate: boolean;
  appDelete: boolean;
  workflowCreate: boolean;
  workflowDelete: boolean;
  moduleCreate?: boolean;
  moduleDelete?: boolean;
  appPromote: boolean;
  appRelease: boolean;
  dataSourceCreate: boolean;
  dataSourceDelete: boolean;

  folderCreate: boolean;
  folderDelete: boolean;
  orgConstantCRUD: boolean;
  tjdbCRUD: boolean;
  orgVariableCRUD: boolean;
  [MODULES.APP]?: UserAppsPermissions;
  [MODULES.GLOBAL_DATA_SOURCE]?: UserDataSourcePermissions;
  [MODULES.WORKFLOWS]?: UserWorkflowPermissions;
  [MODULES.FOLDER]?: UserFolderPermissions;
  // Modules reuse the apps permission shape (editable/viewable sets), resolved from ResourceType.MODULE.
  [MODULES.MODULES]?: UserAppsPermissions;
}
export interface UserWorkflowPermissions {
  editableWorkflowsId: string[];
  isAllEditable: boolean;
  executableWorkflowsId: string[];
  isAllExecutable: boolean;
}

export interface EnvironmentPermissionSet {
  development: boolean;
  staging: boolean;
  production: boolean;
  released: boolean;
}

export interface UserAppsPermissions {
  editableAppsId: string[];
  isAllEditable: boolean;
  viewableAppsId: string[];
  isAllViewable: boolean;
  hiddenAppsId: string[];
  hideAll: boolean;
  // Modules the user owns (apps.user_id). Owner-exempt from hide-from-dashboard.
  ownedAppsId: string[];
  environmentAccess?: EnvironmentPermissionSet;
  appSpecificEnvironmentAccess?: Record<string, EnvironmentPermissionSet>;
}

export interface UserDataSourcePermissions {
  usableDataSourcesId: string[];
  isAllUsable: boolean;
  configurableDataSourceId: string[];
  isAllConfigurable: boolean;
}

export interface UserFolderPermissions {
  editableFoldersId: string[];
  isAllEditable: boolean;
  viewableFoldersId: string[];
  isAllViewable: boolean;
  editAppsInFoldersId: string[];
  isAllEditApps: boolean;
}
