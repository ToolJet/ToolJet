import { WORKSPACE_AUDIT_ACTIONS } from '@modules/organizations/constants/audit-actions';

// Every audit action, keyed by its spec name (`<resource>.<verb>`). Each module owns its actions in
// `constants/audit-actions.ts`; this file only merges them. A route spec may only name an action listed here.
export const AUDIT_CATALOG = {
  ...WORKSPACE_AUDIT_ACTIONS,
} as const satisfies Record<string, { target: string }>;

export type AuditAction = keyof typeof AUDIT_CATALOG;
export type AuditTargetType = (typeof AUDIT_CATALOG)[AuditAction]['target'];
