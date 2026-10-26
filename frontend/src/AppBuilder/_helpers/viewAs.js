// "View as": a Builder previews the app with another user's or group's page, component and query
// permissions. The choice lives in sessionStorage per app, so it lasts for this tab only and never
// travels with a copied link. The server enforces everything; this module only carries the choice.

export const VIEW_AS_HEADER = 'x-tj-view-as';

const KINDS = ['user', 'group'];

const storageKey = (appId) => `tj-view-as:${appId}`;

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
    // Storage blocked: the simulation can't survive the reload that applies it, so it stays off.
  }
}

export function clearViewAs(appId) {
  try {
    window.sessionStorage.removeItem(storageKey(appId));
  } catch {
    // Nothing stored if storage is blocked.
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
