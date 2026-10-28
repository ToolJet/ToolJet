// Legacy 3.21.58 rows have a NULL branch until the backfill; remove when 3.21.58 upgrades are no longer supported.
// SQL: `column` is on the branch bound to `:param`. A NULL-branch row counts as on the default branch, so it
// matches unless `:param` names a non-default branch (a NULL param still matches it). `legacyRowFilter`
// narrows which NULL rows qualify.
export function onBranch(column: string, param: string, legacyRowFilter?: string): string {
  const notFeatureBranch = `NOT EXISTS (SELECT 1 FROM organization_git_sync_branches legacy_wb WHERE legacy_wb.id = :${param} AND legacy_wb.is_default = false)`;
  const legacyRow = [`${column} IS NULL`, legacyRowFilter, notFeatureBranch].filter(Boolean).join(' AND ');
  return `(${column} = :${param} OR (${legacyRow}))`;
}

// Workflow versions keep a NULL branch after the backfill too, so they are never legacy rows.
export function isNotWorkflowVersion(appVersionAlias: string): string {
  return `EXISTS (SELECT 1 FROM apps legacy_app WHERE legacy_app.id = ${appVersionAlias}.app_id AND legacy_app.type <> 'workflow')`;
}

// onBranch for app_versions.
export function appVersionOnBranch(alias: string, param: string): string {
  return onBranch(`${alias}.branch_id`, param, isNotWorkflowVersion(alias));
}

// ORDER BY this ASC: a backfilled row wins over its legacy NULL-branch twin.
export function nullBranchLast(column: string): string {
  return `${column} IS NULL`;
}
