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
 * Remove all tj_active_branch_* keys except the one for the current org.
 * Call once on app load to prevent stale keys from accumulating
 * across migration dumps or org switches.
 */
export function cleanupStaleBranchKeys(orgId) {
  const id = orgId || getOrgId();
  if (!id) return;
  try {
    const currentKey = `${BRANCH_KEY_PREFIX}${id}`;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BRANCH_KEY_PREFIX) && key !== currentKey) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore localStorage errors
  }
}
