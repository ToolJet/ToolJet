import { CreateResourcePermissionObject } from '../interface/granular-permissions.interface';
import { USER_ROLE } from './group-permissions.constant';

export enum ResourceType {
  APP = 'app',
  DATA_SOURCE = 'data_source',
}

export enum DEFAULT_GRANULAR_PERMISSIONS_NAME {
  APP = 'Apps',
  DATA_SOURCE = 'Data sources',
}

export const DEFAULT_RESOURCE_PERMISSIONS = {
  [USER_ROLE.ADMIN]: {
    [ResourceType.APP]: {
      canEdit: true,
      canView: true,
      hideFromDashboard: false,
    },
  },
  [USER_ROLE.END_USER]: {
    [ResourceType.APP]: {
      canEdit: false,
      canView: false,
      hideFromDashboard: false,
    },
  },
  [USER_ROLE.BUILDER]: {
    [ResourceType.APP]: {
      canEdit: true,
      canView: true,
      hideFromDashboard: false,
    },
  },
} as Record<USER_ROLE, Record<ResourceType, CreateResourcePermissionObject>>;
