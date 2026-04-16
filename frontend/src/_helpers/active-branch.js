import { authenticationService } from '@/_services';

const BRANCH_KEY_PREFIX = 'tj_active_branch_';

function getOrgId() {
  return authenticationService.currentSessionValue?.current_organization_id || '';
}

export function getActiveBranch(orgId) {
  const id = orgId || getOrgId();
  if (!id) return null;
  try {
    const stored = localStorage.getItem(`${BRANCH_KEY_PREFIX}${id}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setActiveBranch(branch, orgId) {
  const id = orgId || getOrgId();
  if (!id) return;
  try {
    if (branch) {
      localStorage.setItem(`${BRANCH_KEY_PREFIX}${id}`, JSON.stringify({ id: branch.id, name: branch.name }));
    } else {
      localStorage.removeItem(`${BRANCH_KEY_PREFIX}${id}`);
    }
  } catch {
    // ignore localStorage errors
  }
}

export function getActiveBranchId(orgId) {
  const branch = getActiveBranch(orgId);
  return branch?.id || null;
}

/**
 * Remove stale tj_active_branch_* keys for the current org only.
 * Clears the key if the stored value is corrupted or has no valid branch ID.
 * Does NOT remove keys for other orgs — they may be active in other tabs.
 */
export function cleanupStaleBranchKeys(orgId) {
  const id = orgId || getOrgId();
  if (!id) return;
  try {
    const currentKey = `${BRANCH_KEY_PREFIX}${id}`;
    const stored = localStorage.getItem(currentKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!parsed?.id) {
        localStorage.removeItem(currentKey);
      }
    }
  } catch {
    // ignore localStorage errors
  }
}
