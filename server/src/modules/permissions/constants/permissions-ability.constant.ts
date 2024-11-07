import { TOOLJET_RESOURCE } from 'src/constants/global.constant';
import { ResourceType } from '../../user_resource_permissions/constants/granular-permissions.constant';
import { UserAppsPermissions, UserPermissions } from '@modules/permissions/interface/permissions-ability.interface';

export const PERMISSION_RESOURCE_MAPPING = {
  [TOOLJET_RESOURCE.APP]: ResourceType.APP,
} as Record<TOOLJET_RESOURCE, ResourceType>;

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  isAdmin: false,
  appCreate: false,
  appDelete: false,
  folderCRUD: false,
  orgConstantCRUD: false,
  orgVariableCRUD: false,
  [TOOLJET_RESOURCE.APP]: {
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
