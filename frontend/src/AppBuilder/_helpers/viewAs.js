// "View as": a Builder previews the app with another user's or group's page, component and query
// permissions. The choice lives in sessionStorage per app, so it lasts for this tab only and never
// travels with a copied link. The server enforces everything; this module only carries the choice.

export const VIEW_AS_HEADER = 'x-tj-view-as';

const KINDS = ['user', 'group'];

const storageKey = (appId) => `tj-view-as:${appId}`;
const noticeKey = (appId) => `tj-view-as-notice:${appId}`;

// What View as checks, and what it leaves as the Builder: shown beside the picker and on the chip.
export const VIEW_AS_SCOPE_NOTE =
  'Checks their page, component and query access. Data still loads as you, so anything filtered by your user ID or email shows yours. Embedded modules show what you can see.';

const isTarget = (value) =>
  !!value &&
  KINDS.includes(value.kind) &&
  typeof value.id === 'string' &&
  !!value.id &&
  typeof value.label === 'string';

// target: { kind: 'user' | 'group', id, label } or null when previewing as yourself.
export function readViewAs(appId) {
  if (!appId) return null;
  try {
    const value = JSON.parse(window.sessionStorage.getItem(storageKey(appId)));
    return isTarget(value) ? { kind: value.kind, id: value.id, label: value.label } : null;
  } catch {
    return null;
  }
}

export function saveViewAs(appId, target) {
  try {
    window.sessionStorage.setItem(storageKey(appId), JSON.stringify(target));
  } catch {
    // Storage blocked: the reload that applies the choice reads it from here, so it stays off.
  }
}

// notice: why the simulation was turned off, kept for the next page load when the preview was
// rejected on first load and has to reload the page. Read it back once with takeViewAsNotice.
export function clearViewAs(appId, notice) {
  try {
    window.sessionStorage.removeItem(storageKey(appId));
    if (notice) window.sessionStorage.setItem(noticeKey(appId), notice);
  } catch {
    // Nothing stored if storage is blocked.
  }
}

export function takeViewAsNotice(appId) {
  if (!appId) return null;
  try {
    const notice = window.sessionStorage.getItem(noticeKey(appId));
    window.sessionStorage.removeItem(noticeKey(appId));
    return notice;
  } catch {
    return null;
  }
}

export function viewAsHeaders(target) {
  return target ? { [VIEW_AS_HEADER]: `${target.kind}:${target.id}` } : {};
}

// The server describes who it simulated (custom groups + role, the same shape the session gives a
// real user). Only groups and role change; id, email and name stay the requester's, so data that
// queries filter by the current user is never another person's.
export function simulatedCurrentUser(currentUser, identity) {
  if (!identity) return currentUser;
  return {
    ...currentUser,
    groups: ['all_users', ...identity.groups, identity.role],
    role: identity.role,
  };
}
