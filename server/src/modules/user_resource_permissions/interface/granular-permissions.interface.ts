import { AppsGroupPermissions } from 'src/entities/apps_group_permissions.entity';
import { SearchParamItem } from '@helpers/db-utility/db-utility.interface';

export interface GranularPermissionResourceItem {
  id: string;
}

export interface AppsGroupPermissionsActions {
  canEdit: boolean;
  canView: boolean;
  hideFromDashboard: boolean;
}

export interface UpdateAppsGroupPermissionObject {
  actions: AppsGroupPermissionsActions;
  appsToAdd: GranularPermissionResourceItem[];
  appsToDelete: GranularPermissionResourceItem[];
}

export interface GranularPermissionQuerySearchParam {
  [key: string]: SearchParamItem | boolean | string | number;
  name?: SearchParamItem;
  type?: string;
}

export interface CreateAppsPermissionsObject {
  canEdit?: boolean;
  canView?: boolean;
  hideFromDashboard?: boolean;
}

export type CreateResourcePermissionObject = CreateAppsPermissionsObject;

export type GranularResourcePermissions = AppsGroupPermissions;
