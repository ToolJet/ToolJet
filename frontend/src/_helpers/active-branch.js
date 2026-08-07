// The browser URL is the source of truth for the active Git branch: it carries
// `?branch=<name>` (human-readable, matches the `version=<name>` convention) on the
// dashboard, app editor, and app preview URLs, so a reload / shared link persists the branch.
//
// API calls need the branch *id* (see appendBranchParam), while the URL carries the *name*.
// The branches store resolves name -> id once it has loaded `branches` and calls
// setActiveBranch(branch), which caches the id here and reflects the name into the URL.
// getActiveBranchId() returns that cached id synchronously so appendBranchParam stays simple.
//
// (Replaces the old sessionStorage/localStorage + cross-tab focus-sync mechanism.)

const BRANCH_URL_PARAM = 'branch';

/**
 * Whether the given dashboard path is a Git/branch-relevant page — mirrors the Header's
 * `isWorkspaceGitPage` (which gates the branch dropdown): the apps list (`/<ws>`) and the
 * `data-sources` / `modules` sections. Everything else (the `/home` landing, settings,
 * workflows, …) is branch-agnostic and must NOT carry `?branch`. Editor / preview routes
 * (`/<ws>/apps/...`, `/applications/...`) manage the branch param themselves.
 */
function isBranchRelevantPath(pathname = window.location.pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 1) return true; // /<workspaceId> → apps list
  if (parts[0] === 'applications') return true; // preview / viewer (/applications/:slug/...)
  if (parts[1] === 'apps') return true; // editor (/<workspaceId>/apps/:slug/...)
  return parts.length >= 2 && ['data-sources', 'modules'].includes(parts[1]);
}

// In-memory id cache, set by the branches store when it resolves the URL branch name -> id.
let _activeBranchId = null;
// The URL branch NAME that _activeBranchId currently corresponds to (undefined = not yet
// resolved this session). Tracked so callers can tell whether the cache is in sync with the
// current URL — a stale cache from a previous route must not be treated as "resolved".
let _resolvedBranchName;
// Pending waiters for whenBranchResolved() — flushed when resolution completes.
const _resolutionWaiters = [];

/** Read the active branch NAME from the browser URL (null when absent / non-git). */
export function getBranchNameFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get(BRANCH_URL_PARAM) || null;
  } catch {
    return null;
  }
}

/** The resolved active branch ID for API calls. Null until the store resolves name -> id. */
export function getActiveBranchId() {
  return _activeBranchId;
}

/**
 * Appends `?branch=<name>` to an in-app navigation path so the active branch is carried across
 * route changes (dashboard <-> editor <-> preview) and survives a reload. Defaults to the branch
 * in the current URL — pass an explicit name (e.g. the store's currentBranch.name) to override.
 * No-op when there is no branch (non-git / no branch context) or the path already sets it.
 */
export function appendBranchName(path, branchName = getBranchNameFromUrl() || _resolvedBranchName) {
  if (!path || !branchName) return path;
  if (/[?&]branch=/.test(path)) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}branch=${encodeURIComponent(branchName)}`;
}

/**
 * Write (or clear) `?branch=<name>` on the current URL without adding a history entry.
 * Writing is scoped to branch-relevant pages (see isBranchRelevantPath) so the branch-agnostic
 * landing pages — notably `/home`, where the post-login redirect lands — never get stamped with
 * a stray `?branch=` param. Clearing (name falsy) is always allowed.
 */
export function setBranchInUrl(name) {
  try {
    if (name && !isBranchRelevantPath()) return;
    const url = new URL(window.location.href);
    if (name) {
      url.searchParams.set(BRANCH_URL_PARAM, name);
    } else {
      url.searchParams.delete(BRANCH_URL_PARAM);
    }
    window.history.replaceState(window.history.state, '', url);
  } catch {
    // ignore URL errors
  }
}

/**
 * Select the active branch: cache its id (for API calls) and reflect its name into the URL.
 * Pass a branch object `{ id, name }`, or null to clear (non-git / disabled).
 * Kept as the public entry point so existing callers don't need to change.
 */
export function setActiveBranch(branch) {
  _activeBranchId = branch?.id || null;
  _resolvedBranchName = branch?.name || null;
  setBranchInUrl(branch?.name || null);
  // Resolution ran — unblock anything gated on whenBranchResolved().
  while (_resolutionWaiters.length) _resolutionWaiters.shift()();
}

/** The URL branch name the cached id currently corresponds to (undefined until first resolve). */
export function getResolvedBranchName() {
  return _resolvedBranchName;
}

/**
 * Resolves once the active branch has been resolved to an id (or determined absent), so callers
 * can gate branch-sensitive app-loads on it — avoiding a default-branch flash on a feature
 * branch after a hard reload.
 *
 * - Returns immediately when the URL carries no `branch` param (non-git / default-branch: no
 *   branch context to wait for) or when the cache already corresponds to the URL's branch.
 * - Otherwise waits until setActiveBranch() resolves THIS URL's branch (store init / route
 *   change), bounded by `timeoutMs` so an app-load never hangs if resolution fails. Keying on
 *   the resolved branch name (not a sticky flag) means a stale cache from a previous route
 *   doesn't let the app-load race ahead on the wrong branch.
 */
export function whenBranchResolved(timeoutMs = 4000) {
  const urlBranchName = getBranchNameFromUrl();
  if (!urlBranchName || _resolvedBranchName === urlBranchName) return Promise.resolve();
  return new Promise((resolve) => {
    _resolutionWaiters.push(resolve);
    setTimeout(resolve, timeoutMs);
  });
}

/**
 * Appends the active branch as a `branch_id` query param to an API URL. The backend JWT
 * strategy reads `branch_id` from the query and exposes it as `user.branchId`, and app-scoped
 * guards read it to overlay branch metadata.
 *
 * - Pass an explicit `branchId` to override the active branch.
 * - Defaults to the resolved active branch id via getActiveBranchId().
 * - Returns the URL unchanged when there is no branch (non-git orgs, or before the store has
 *   resolved) — the backend then resolves the default branch (general reads) or NULL
 *   (folder-apps / workflows).
 * - Does not append when the URL already carries a `branch_id` param (explicit wins).
 *
 * For NULL-branch contexts (workflows) callers should simply NOT wrap the URL.
 */
export function appendBranchParam(url, branchId = getActiveBranchId()) {
  if (!branchId) return url;
  if (/[?&]branch_id=/.test(url)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}branch_id=${encodeURIComponent(branchId)}`;
}
