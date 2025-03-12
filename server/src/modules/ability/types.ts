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
  dataSourceCreate: boolean;
  dataSourceDelete: boolean;
  folderCRUD: boolean;
  orgConstantCRUD: boolean;
  orgVariableCRUD: boolean;
  [MODULES.APP]?: UserAppsPermissions;
  [MODULES.GLOBAL_DATA_SOURCE]?: UserDataSourcePermissions;
}

export interface UserAppsPermissions {
  editableAppsId: string[];
  isAllEditable: boolean;
  viewableAppsId: string[];
  isAllViewable: boolean;
  hiddenAppsId: string[];
  hideAll: boolean;
}

export interface UserDataSourcePermissions {
  usableDataSourcesId: string[];
  isAllUsable: boolean;
  configurableDataSourceId: string[];
  isAllConfigurable: boolean;
}
