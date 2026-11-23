import * as winston from 'winston';

export const auditLog = winston.format((info) => {
  info.auditLog = info.options;
  delete info.options;
  info.label = info.auditLog?.['resourceType'];
  return info;
});

export const PER_PAGE_DEFAULT_COUNT = '10';

export enum FEATURE_KEY {
  VIEW_LOGS = 'viewLogs',
  VIEW_RESOURCES = 'viewResoures',
}

// Actions written by services and workers rather than by a route's `auditLogsKey`, listed so the Actions
// filter offers them. Keyed like the resources list (one group per source module).
export const AUDIT_ONLY_ACTIONS: Record<string, string[]> = {
  GitSync: [
    'RESOURCE_PUSH_COMMIT',
    'RESOURCE_DELETE_PUSH_COMMIT',
    'RESOURCE_PULL_COMMIT',
    'WORKSPACE_PUSH_COMMIT',
    'WORKSPACE_PULL_COMMIT',
  ],
};

// Renamed or replaced actions: filtering on the new name also finds rows written under the old one.
export const LEGACY_ACTION_ALIASES: Record<string, string[]> = {
  WORKSPACE_PULL_COMMIT: ['MASTER_PULL_COMMIT'],
  RESOURCE_PUSH_COMMIT: ['GIT_SYNC_PUSH'],
  RESOURCE_PULL_COMMIT: ['GIT_SYNC_APP_CREATE'],
};

export function expandLegacyActions(actions: string[]): string[] {
  return [...new Set(actions.flatMap((action) => [action, ...(LEGACY_ACTION_ALIASES[action] ?? [])]))];
}
