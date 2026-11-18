// Every audit action, keyed by its spec name (`<resource>.<verb>`). A route spec may only name an
// action listed here, so this file is the single list of what the audit log can record.
export const AUDIT_TARGET_TYPES = ['workspace', 'app', 'module', 'workflow', 'data_source'] as const;
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];

// A Git Sync resource event targets whichever resource was pushed or pulled.
const GIT_RESOURCE_TARGETS = ['app', 'module', 'workflow', 'data_source'] as const;

export const AUDIT_CATALOG = {
  'workspace.created': { target: 'workspace' },
  'workspace.updated': { target: 'workspace' },
  'workspace.archived': { target: 'workspace' },
  'workspace.unarchived': { target: 'workspace' },
  'workspace.default_set': { target: 'workspace' },
  // Git Sync events use the names the Audit Logs page already knows, and are written by services and
  // workers when the git operation finishes (not by route specs).
  RESOURCE_PUSH_COMMIT: { target: GIT_RESOURCE_TARGETS },
  RESOURCE_DELETE_PUSH_COMMIT: { target: GIT_RESOURCE_TARGETS },
  RESOURCE_PULL_COMMIT: { target: GIT_RESOURCE_TARGETS },
  WORKSPACE_PUSH_COMMIT: { target: 'workspace' },
  WORKSPACE_PULL_COMMIT: { target: 'workspace' },
} as const satisfies Record<string, { target: AuditTargetType | readonly AuditTargetType[] }>;

export type AuditAction = keyof typeof AUDIT_CATALOG;

export function catalogAllowsTarget(action: AuditAction, type: string): boolean {
  const target: AuditTargetType | readonly AuditTargetType[] = AUDIT_CATALOG[action].target;
  return typeof target === 'string' ? target === type : (target as readonly string[]).includes(type);
}
