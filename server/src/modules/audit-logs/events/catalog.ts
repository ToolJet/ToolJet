// Every audit action, keyed by its spec name (`<resource>.<verb>`). A route spec may only name an
// action listed here, so this file is the single list of what the audit log can record.
export const AUDIT_TARGET_TYPES = ['workspace'] as const;
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];

export const AUDIT_CATALOG = {
  'workspace.created': { target: 'workspace' },
  'workspace.updated': { target: 'workspace' },
  'workspace.archived': { target: 'workspace' },
  'workspace.unarchived': { target: 'workspace' },
  'workspace.default_set': { target: 'workspace' },
} as const satisfies Record<string, { target: AuditTargetType }>;

export type AuditAction = keyof typeof AUDIT_CATALOG;
