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
