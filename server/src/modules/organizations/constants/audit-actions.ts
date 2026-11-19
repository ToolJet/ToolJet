// Audit actions for workspaces, merged into AUDIT_CATALOG (audit-logs/events/catalog.ts).
export const WORKSPACE_AUDIT_ACTIONS = {
  'workspace.created': { target: 'workspace' },
  'workspace.updated': { target: 'workspace' },
  'workspace.archived': { target: 'workspace' },
  'workspace.unarchived': { target: 'workspace' },
  'workspace.default_set': { target: 'workspace' },
} as const;
