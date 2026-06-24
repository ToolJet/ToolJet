import { MODULES } from '@modules/app/constants/modules';
import { UserAppsPermissions, UserDataSourcePermissions, UserPermissions, UserWorkflowPermissions } from './types';
import { APP_TYPES } from '@modules/apps/constants';

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  isSuperAdmin: false,
  isAdmin: false,
  isBuilder: false,
  isEndUser: false,
  appCreate: false,
  appDelete: false,
  workflowCreate: false,
  workflowDelete: false,
  moduleCreate: false,
  moduleDelete: false,
  appPromote: false,
  appRelease: false,
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
    ownedAppsId: [],
  },
  [MODULES.WORKFLOWS]: {
    editableWorkflowsId: [],
    isAllEditable: false,
    executableWorkflowsId: [],
    isAllExecutable: false,
  },
  // Modules reuse the apps permission shape, keyed separately so they never pollute app resolution.
  [MODULES.MODULES]: {
    editableAppsId: [],
    isAllEditable: false,
    viewableAppsId: [],
    isAllViewable: false,
    hiddenAppsId: [],
    hideAll: false,
    ownedAppsId: [],
  },
};

export const RESOURCE_TO_APP_TYPE_MAP = {
  [MODULES.APP]: APP_TYPES.FRONT_END,
  [MODULES.WORKFLOWS]: APP_TYPES.WORKFLOW,
  [MODULES.MODULES]: APP_TYPES.MODULE,
} as const;

export const DEFAULT_USER_APPS_PERMISSIONS: UserAppsPermissions = {
  editableAppsId: [],
  isAllEditable: false,
  viewableAppsId: [],
  isAllViewable: false,
  hiddenAppsId: [],
  hideAll: false,
  ownedAppsId: [],
  environmentAccess: {
    development: false,
    staging: false,
    production: false,
    released: false,
  },
  appSpecificEnvironmentAccess: {},
};

export const DEFAULT_USER_WORKFLOW_PERMISSIONS: UserWorkflowPermissions = {
  editableWorkflowsId: [],
  isAllEditable: false,
  executableWorkflowsId: [],
  isAllExecutable: false,
};

export const DEFAULT_USER_DATA_SOURCE_PERMISSIONS: UserDataSourcePermissions = {
  usableDataSourcesId: [],
  isAllUsable: false,
  configurableDataSourceId: [],
  isAllConfigurable: false,
};
