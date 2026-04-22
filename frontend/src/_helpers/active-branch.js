import { authenticationService } from '@/_services';

const BRANCH_KEY_PREFIX = 'tj_active_branch_';

function getOrgId() {
  return authenticationService.currentSessionValue?.current_organization_id || '';
}

export function getActiveBranch(orgId) {
  const id = orgId || getOrgId();
  if (!id) return null;
  try {
    const key = `${BRANCH_KEY_PREFIX}${id}`;
    const sessionStored = sessionStorage.getItem(key);
    if (sessionStored) return JSON.parse(sessionStored);
    // Seed sessionStorage from localStorage so new tabs inherit the active branch
    const localStored = localStorage.getItem(key);
    if (localStored) {
      sessionStorage.setItem(key, localStored);
      return JSON.parse(localStored);
    }
    return null;
  } catch {
    return null;
  }
}

export function setActiveBranch(branch, orgId) {
  const id = orgId || getOrgId();
  if (!id) return;
  try {
    const key = `${BRANCH_KEY_PREFIX}${id}`;
    if (branch) {
      const value = JSON.stringify({ id: branch.id, name: branch.name });
      sessionStorage.setItem(key, value);
      localStorage.setItem(key, value);
    } else {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  } catch {
    // ignore storage errors
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
  const currentKey = `${BRANCH_KEY_PREFIX}${id}`;
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const stored = storage.getItem(currentKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed?.id) {
          storage.removeItem(currentKey);
        }
      }
    } catch {
      // ignore storage errors
    }
  }
}
