import { AbilityUtilService } from '@modules/ability/util.service';
import { UserAppsPermissions, UserFolderPermissions, UserPermissions } from '@modules/ability/types';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { FOLDER_RESOURCE_TYPE_BY_APP_TYPE } from '@modules/folder-apps/ability';
import { FOLDER_PERMISSION_BY_APP_TYPE } from '@modules/folders/constants';
import { SqlParams } from './sql-params';

// Row actions are display hints mirroring apps/ability/{app,workflow}.ability.ts and
// folders/service.ts checkFolderManagePermission. Mutating endpoints re-check for real.

export type LaunchBlockReason = 'not_released' | 'maintenance' | 'no_released_access';
export interface LaunchAction {
  enabled: boolean;
  reason: LaunchBlockReason | null;
}
export interface AppActions {
  launch: LaunchAction | null;
  edit: boolean;
  delete: boolean;
  pin: boolean;
}
export interface FolderActions {
  rename: boolean;
  delete: boolean;
  pin: boolean;
}
export interface ActionApp {
  id: string;
  ownerId: string;
  folderId: string | null;
  currentVersionId: string | null;
  isMaintenanceOn: boolean;
}
export interface ActionFolder {
  id: string;
  ownerId: string;
  appCount: number;
}
export interface GitState {
  enabled: boolean;
  multiBranch: boolean;
  onDefaultBranch: boolean;
}
export type FolderAccess =
  | { kind: 'all' }
  | { kind: 'with_visible_apps' }
  | { kind: 'granted'; folderIds: string[]; userId: string };

const isAdmin = (p: UserPermissions) => p.isAdmin || p.isSuperAdmin;

function folderPermissionsFor(p: UserPermissions, type: APP_TYPES): UserFolderPermissions | undefined {
  return p[FOLDER_RESOURCE_TYPE_BY_APP_TYPE[type] ?? MODULES.FOLDER];
}

function appPermissionsFor(p: UserPermissions, type: APP_TYPES): UserAppsPermissions | undefined {
  return type === APP_TYPES.MODULE ? p[MODULES.MODULES] : p[MODULES.APP];
}

function editableByGroup(p: UserPermissions, type: APP_TYPES, appId: string): boolean {
  if (type === APP_TYPES.WORKFLOW) {
    const w = p[MODULES.WORKFLOWS];
    return !!w && (w.isAllEditable || w.editableWorkflowsId.includes(appId));
  }
  if (type === APP_TYPES.MODULE && !p.isBuilder) return false;
  const a = appPermissionsFor(p, type);
  return !!a && (a.isAllEditable || a.editableAppsId.includes(appId));
}

function editableViaFolder(p: UserPermissions, type: APP_TYPES, folderId: string | null): boolean {
  const f = folderPermissionsFor(p, type);
  return !!f && !!folderId && (f.isAllEditApps || f.editAppsInFoldersId.includes(folderId));
}

function deletable(p: UserPermissions, type: APP_TYPES, userId: string, app: ActionApp): boolean {
  if (isAdmin(p)) return true;
  if (!editableByGroup(p, type, app.id)) return false;
  if (type === APP_TYPES.WORKFLOW) return !!p.workflowDelete;
  const isOwner = app.ownerId === userId;
  return (type === APP_TYPES.MODULE ? !!p.moduleDelete : !!p.appDelete) || isOwner;
}

// v1 parity (frontend/src/HomePage/AppCard.jsx:205-260): released → maintenance → released
// access, first match wins; released-access block applies to builders only.
function launchAction(p: UserPermissions, type: APP_TYPES, app: ActionApp): LaunchAction | null {
  // v1 parity: no Launch button for workflows or modules (AppCard.jsx:213-232, 523)
  if (type === APP_TYPES.WORKFLOW || type === APP_TYPES.MODULE) return null;
  if (!app.currentVersionId) return { enabled: false, reason: 'not_released' };
  if (app.isMaintenanceOn) return { enabled: false, reason: 'maintenance' };
  const a = appPermissionsFor(p, type);
  if (p.isBuilder && !(a && AbilityUtilService.canAccessAppInEnvironment(a, app.id, 'released'))) {
    return { enabled: false, reason: 'no_released_access' };
  }
  return { enabled: true, reason: null };
}

export function appActions(p: UserPermissions, type: APP_TYPES, userId: string, app: ActionApp): AppActions {
  const edit = isAdmin(p) || editableByGroup(p, type, app.id) || editableViaFolder(p, type, app.folderId);
  const del = deletable(p, type, userId, app);
  return { launch: launchAction(p, type, app), edit, delete: del, pin: true };
}

export function folderActions(
  p: UserPermissions,
  type: APP_TYPES,
  userId: string,
  folder: ActionFolder,
  git: GitState
): FolderActions {
  const privileged = isAdmin(p) || folder.ownerId === userId;
  const f = folderPermissionsFor(p, type);
  const canRename = privileged || (!!f && (f.isAllEditable || f.editableFoldersId.includes(folder.id)));
  const canDelete = privileged || !!p[FOLDER_PERMISSION_BY_APP_TYPE[type]?.deleteKey ?? 'folderDelete'];
  // folders/service.ts:72 rejects every rename in multi-branch mode
  const rename = canRename && !git.multiBranch;
  // frontend/src/HomePage/Folders.jsx:86-91 — workflows are never branch-locked
  const branchLocked = git.multiBranch && git.onDefaultBranch && type !== APP_TYPES.WORKFLOW;
  const del = canDelete && !branchLocked && !(git.enabled && folder.appCount > 0);
  return { rename, delete: del, pin: true };
}

// Mirrors folder-apps/service.ts filterFoldersByPermissions as a SQL predicate.
export function resolveFolderAccess(p: UserPermissions, type: APP_TYPES, userId: string): FolderAccess {
  if (isAdmin(p)) return { kind: 'all' };
  if (p.isEndUser) return { kind: 'with_visible_apps' };
  const f = folderPermissionsFor(p, type);
  if (!f || f.isAllEditable || f.isAllEditApps || f.isAllViewable) return { kind: 'all' };
  const folderIds = [...new Set([...f.editableFoldersId, ...f.editAppsInFoldersId, ...f.viewableFoldersId])];
  return { kind: 'granted', folderIds, userId };
}

export function folderVisibilityPredicate(access: FolderAccess, alias: string, params: SqlParams): string {
  switch (access.kind) {
    case 'all':
      return 'TRUE';
    case 'with_visible_apps':
      return `${alias}.app_count > 0`;
    case 'granted':
      return `(${alias}.id = ANY(${params.add(access.folderIds)}::uuid[]) OR ${alias}.owner_id = ${params.add(access.userId)} OR ${alias}.app_count > 0)`;
  }
}

export function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, '\\$&')}%`;
}
