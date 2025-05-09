import { MODULES } from '@modules/app/constants/modules';
import { UserAppsPermissions, UserDataSourcePermissions, UserPermissions } from './types';

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  isSuperAdmin: false,
  isAdmin: false,
  isBuilder: false,
  isEndUser: false,
  appCreate: false,
  appDelete: false,
  dataSourceCreate: false,
  dataSourceDelete: false,
  folderCRUD: false,
  orgConstantCRUD: false,
  orgVariableCRUD: false,
  [MODULES.APP]: {
    editableAppsId: [],
    isAllEditable: false,
    viewableAppsId: [],
    isAllViewable: false,
    hiddenAppsId: [],
    hideAll: false,
  },
};

export const DEFAULT_USER_APPS_PERMISSIONS: UserAppsPermissions = {
  editableAppsId: [],
  isAllEditable: false,
  viewableAppsId: [],
  isAllViewable: false,
  hiddenAppsId: [],
  hideAll: false,
};

export const DEFAULT_USER_DATA_SOURCE_PERMISSIONS: UserDataSourcePermissions = {
  usableDataSourcesId: [],
  isAllUsable: false,
  configurableDataSourceId: [],
  isAllConfigurable: false,
};
