import * as winston from 'winston';

interface AuditLogOptions {
  resourceType?: string;
  [key: string]: any;
}

export const auditLog = winston.format((info) => {
  info.auditLog = info.options as AuditLogOptions;
  delete info.options;
  info.label = (info.auditLog as AuditLogOptions)?.resourceType;
  return info;
});

export const PER_PAGE_DEFAULT_COUNT = '10';

export enum FEATURE_KEY {
  VIEW_LOGS = 'viewLogs',
}
