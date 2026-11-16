/**
 * Single source of truth for "what may the current user do to this data source folder".
 *
 * Mirrors the server's own rules so the sidebar never offers an action the API will reject, and
 * never hides one it would allow:
 *
 *  - create / delete  -> the coarse `data_source_folder_create` / `_delete` group flags
 *    (`server/src/modules/folders/ability/index.ts`).
 *  - rename (UPDATE)  -> admin/super-admin, the folder's creator, or a granular DATA_SOURCE_FOLDER
 *    "Edit folder" grant covering this folder
 *    (`FoldersService.checkFolderManagePermission`, server/src/modules/folders/service.ts).
 *
 * The coarse create flag deliberately does NOT grant rename. The ability guard lets a create-flag
 * holder past, but checkFolderManagePermission short-circuits on the coarse flag for `delete`
 * only — so treating create as a rename gate shows a Rename that 403s on click.
 *
 * Real security is enforced server-side; these helpers only decide whether an affordance is shown.
 * Pure functions — the session is passed in so they stay trivially testable.
 */

const isWorkspaceAdmin = (session) => !!(session?.super_admin || session?.admin);

/**
 * @param {object} session - authenticationService.currentSessionValue
 * @returns {boolean}
 */
export const canCreateDataSourceFolder = (session) =>
  !!(isWorkspaceAdmin(session) || session?.user_permissions?.data_source_folder_create);

/**
 * @param {object} session - authenticationService.currentSessionValue
 * @returns {boolean}
 */
export const canDeleteDataSourceFolder = (session) =>
  !!(isWorkspaceAdmin(session) || session?.user_permissions?.data_source_folder_delete);

/**
 * @param {object} session - authenticationService.currentSessionValue
 * @param {object} folder - a folder from GET /api/folder-data-sources (needs `id`, `created_by`)
 * @param {{ isBranchingEnabled?: boolean }} [options] - multi-branch git sync state
 * @returns {boolean}
 */
export const canRenameDataSourceFolder = (session, folder, { isBranchingEnabled = false } = {}) => {
  if (!session || !folder) return false;

  // With git sync multi-branching on, the same folder spans branches and the server refuses every
  // rename ("Folders with git-synced data sources cannot be renamed") — admins included.
  if (isBranchingEnabled) return false;

  if (isWorkspaceAdmin(session)) return true;

  const currentUserId = session.current_user?.id;
  if (currentUserId != null && folder.created_by === currentUserId) return true;

  const folderPermissions = session.data_source_folder_group_permissions;
  if (folderPermissions) {
    return !!(folderPermissions.is_all_editable || folderPermissions.editable_folders_id?.includes(folder.id));
  }

  // No granular bucket in the session at all: CE, or a workspace whose groups predate the feature.
  // Fall back to the coarse create flag rather than hiding folder management outright.
  return !!session.user_permissions?.data_source_folder_create;
};
