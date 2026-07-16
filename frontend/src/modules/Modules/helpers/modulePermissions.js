/**
 * Single source of truth for "can the current user edit this module".
 *
 * Mirrors the `appType === 'module'` / `update` branch of HomePage.canUserPerform.
 * Real security is enforced server-side (app.ability: UPDATE is excluded for
 * Build-with access); this helper only decides whether the module editor UI runs
 * in read-only mode (Build-with / view-only) or editable mode.
 *
 * Pure function — pass the session in so it stays trivially testable.
 *
 * @param {object} session  - authenticationService.currentSessionValue
 * @param {string} moduleId - the module's app id (matches editable_apps_id entries)
 * @param {string} [ownerId] - the module creator's user id, for the owner override
 * @returns {boolean}
 */
export const canEditModule = (session, moduleId, ownerId) => {
  if (!session) return false;
  if (session.super_admin || session.admin) return true;

  const perms = session.module_group_permissions;
  const currentUserId = session.current_user?.id;
  const isOwner = ownerId != null && currentUserId != null && currentUserId === ownerId;

  if (perms) {
    return Boolean(perms.is_all_editable || (moduleId && perms.editable_apps_id?.includes(moduleId)) || isOwner);
  }

  // CE fallback (no module permissions feature present): any builder can edit modules
  return session.role?.name === 'builder';
};
