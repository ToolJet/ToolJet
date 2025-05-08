import * as winston from 'winston';

export const auditLog = winston.format((info) => {
  info.auditLog = info.options;
  delete info.options;
  info.label = info.auditLog.resourceType;
  return info;
});

export const PER_PAGE_DEFAULT_COUNT = '10';

export enum FEATURE_KEY {
  VIEW_LOGS = 'viewLogs',
}
