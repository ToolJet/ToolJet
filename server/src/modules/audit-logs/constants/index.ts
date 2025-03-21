import { MODULES } from '@modules/app/constants/modules';
import * as winston from 'winston';

export interface AuditLogFields {
  userId: string;
  organizationId: string;
  resourceId: string;
  resourceType: MODULES;
  actionType: string;
  resourceName?: string;
  metadata?: object;
}

export const auditLog = winston.format((info) => {
  info.auditLog = info.options;
  delete info.options;
  info.label = info.auditLog.resourceType;
  return info;
});

export const PER_PAGE_DEFAULT_COUNT = '10';
// export enum ActionTypes {
//   USER_LOGIN = 'USER_LOGIN',
//   USER_SIGNUP = 'USER_SIGNUP',
//   USER_INVITE = 'USER_INVITE',
//   USER_INVITE_REDEEM = 'USER_INVITE_REDEEM',

//   APP_CREATE = 'APP_CREATE',
//   APP_UPDATE = 'APP_UPDATE',
//   APP_VIEW = 'APP_VIEW',
//   APP_DELETE = 'APP_DELETE',
//   APP_IMPORT = 'APP_IMPORT',
//   APP_EXPORT = 'APP_EXPORT',
//   APP_CLONE = 'APP_CLONE',

//   DATA_QUERY_RUN = 'DATA_QUERY_RUN',
//   DATA_SOURCE_CREATE = 'DATA_SOURCE_CREATE',
//   DATA_SOURCE_DELETE = 'DATA_SOURCE_DELETE',
//   DATA_SOURCE_UPDATE = 'DATA_SOURCE_UPDATE',

//   GROUP_PERMISSION_CREATE = 'GROUP_PERMISSION_CREATE',
//   GROUP_PERMISSION_UPDATE = 'GROUP_PERMISSION_UPDATE',
//   GROUP_PERMISSION_DELETE = 'GROUP_PERMISSION_DELETE',
//   APP_GROUP_PERMISSION_UPDATE = 'APP_GROUP_PERMISSION_UPDATE',

//   GIT_SYNC_ENABLE = 'GIT_SYNC_ENABLE',
//   GIT_SYNC_DISABLE = 'GIT_SYNC_DISABLE',
//   GIT_SYNC_FINALISE = 'GIT_SYNC_FINALISE',
//   GIT_SYNC_DELETE = 'GIT_SYNC_DELETE',
// }

// export enum ResourceTypes {
//   USER = 'USER',
//   APP = 'APP',
//   DATA_QUERY = 'DATA_QUERY',
//   DATA_SOURCE = 'DATA_SOURCE',
//   GROUP_PERMISSION = 'GROUP_PERMISSION',
//   APP_GROUP_PERMISSION = 'APP_GROUP_PERMISSION',
//   GIT_SYNC = 'GIT_SYNC',
// }
