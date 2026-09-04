// Shared by the module viewer, both workflow popups and the workflow query editor so the same
// concept reads the same everywhere. BRANCH rows carry an opaque uuid in `name`, so nothing may
// render `v.name` without going through versionLabel.

// Persisted values, mirrored from server/src/modules/versions/ref-sentinels.ts. Changing either
// string orphans every query holding it.
export const DEFAULT_BRANCH_DRAFT_SENTINEL = '__default_branch_draft__';
export const WORKFLOW_CURRENT_BRANCH_SENTINEL = '__current_branch__';

export const badgeStyle = (bg, color) => ({
  backgroundColor: bg,
  color,
  padding: '0 6px',
  borderRadius: '4px',
  fontWeight: 500,
  lineHeight: '18px',
  flexShrink: 0,
});

export const VERSION_BADGES = {
  DRAFT: { text: 'Draft', bg: 'var(--background-warning-weak)', color: 'var(--text-warning)' },
  RELEASED: { text: 'Released', bg: 'var(--background-success-weak)', color: 'var(--text-success)' },
};

// The API returns both casings depending on the endpoint.
const versionType = (v) => v.version_type ?? v.versionType;

export const isCurrentBranchRow = (v, activeBranchId) => versionType(v) === 'branch' && v.branchId === activeBranchId;

export const isDefaultBranchDraft = (v) => versionType(v) === 'version' && v.status === 'DRAFT';

export function versionLabel(v, { activeBranchId, isOnMain, defaultBranchName }) {
  if (isCurrentBranchRow(v, activeBranchId)) {
    return isOnMain ? defaultBranchName : 'Current branch';
  }
  if (isDefaultBranchDraft(v)) return defaultBranchName;
  return v.displayName ?? v.name;
}

export function versionBadge(v) {
  return isDefaultBranchDraft(v) ? VERSION_BADGES.DRAFT : undefined;
}

// Mirrors getIsModuleSynced: all drafts in git means synced, any unsynced draft means not, and
// with no draft at all fall back to any version ever synced.
export const getIsWorkflowSynced = (versions = []) => {
  const drafts = versions.filter((v) => v.status === 'DRAFT');
  if (drafts.length === 0) return versions.some((v) => (v.is_synced ?? v.isSynced) === true);
  return drafts.every((v) => (v.is_synced ?? v.isSynced) === true);
};

// Boolean rather than a row lookup: the unique index guaranteeing one default-branch draft is
// predicated on is_synced, so an unsynced app may hold several and a per-row map would emit
// duplicate entries carrying the same value.
export const hasDefaultBranchDraft = (versions = []) => versions.some(isDefaultBranchDraft);

// Row set for any of the three pickers, replacing the `status === 'PUBLISHED'` filter that
// stripped every version a feature branch owns. For a synced workflow under git sync,
// VERSION-type drafts are reached through the synthetic entries the caller adds rather than
// listed individually; otherwise every version row is listed, drafts included.
export const scopeVersionsForPicker = (versions, { activeBranchId, isGitSyncEnabled }) => {
  const own = (versions ?? []).filter((v) => versionType(v) !== 'branch' || v.branchId === activeBranchId);
  if (!isGitSyncEnabled || !getIsWorkflowSynced(own)) return own;
  return own.filter((v) => !isDefaultBranchDraft(v));
};
