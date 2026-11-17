import { UserFolderPermissions, UserPermissions } from '@modules/ability/types';
import { MODULES } from '@modules/app/constants/modules';
import { FolderActions } from '@modules/apps/dashboard/actions';
import { SqlParams } from '@modules/apps/dashboard/sql-params';

// Row actions are display hints mirroring data-sources/ability/index.ts, data-sources/repository.ts
// allGlobalDS and folders/service.ts checkFolderManagePermission. Mutating endpoints re-check for real.

export type { FolderActions };
export interface DataSourceActions {
  edit: boolean;
  delete: boolean;
  pin: boolean;
}
export interface ActionFolder {
  id: string;
  ownerId: string | null;
  hasDataSourcesOnAnyBranch: boolean;
}
export interface DataSourceGitState {
  enabled: boolean;
  multiBranch: boolean;
}
export type DataSourceFolderAccess = { kind: 'all' } | { kind: 'granted'; folderIds: string[]; userId: string };

const isAdmin = (p: UserPermissions) => p.isAdmin || p.isSuperAdmin;

function folderPermissionsFor(p: UserPermissions): UserFolderPermissions | undefined {
  return p[MODULES.DATA_SOURCE_FOLDER];
}

// v1 parity: data-sources/repository.ts allGlobalDS. `null` = every data source of the workspace.
export function visibleDataSourceIds(p: UserPermissions): string[] | null {
  if (isAdmin(p) || p.dataSourceCreate || p.dataSourceDelete) return null;
  const d = p[MODULES.GLOBAL_DATA_SOURCE];
  if (!d) return [];
  if (d.isAllUsable || d.isAllConfigurable) return null;
  return [...new Set([...d.usableDataSourcesId, ...d.configurableDataSourceId])];
}

export function canEditDataSource(p: UserPermissions, dataSourceId: string): boolean {
  const d = p[MODULES.GLOBAL_DATA_SOURCE];
  return (
    isAdmin(p) || !!p.dataSourceCreate || !!d?.isAllConfigurable || !!d?.configurableDataSourceId.includes(dataSourceId)
  );
}

export function canDeleteDataSource(p: UserPermissions): boolean {
  return isAdmin(p) || !!p.dataSourceDelete;
}

// Decides which of the caller's activity columns orders the list.
export function isEditCapable(p: UserPermissions): boolean {
  const d = p[MODULES.GLOBAL_DATA_SOURCE];
  return isAdmin(p) || !!p.dataSourceCreate || !!d?.isAllConfigurable || !!d?.configurableDataSourceId.length;
}

export function dataSourceActions(p: UserPermissions, dataSourceId: string): DataSourceActions {
  return { edit: canEditDataSource(p, dataSourceId), delete: canDeleteDataSource(p), pin: true };
}

// folders/service.ts: updateFolder rejects every rename in multi-branch mode; assertFolderDeletable
// rejects a delete in multi-branch mode while the folder holds data sources on any branch.
export function folderActions(
  p: UserPermissions,
  userId: string,
  folder: ActionFolder,
  git: DataSourceGitState
): FolderActions {
  const privileged = isAdmin(p) || folder.ownerId === userId;
  const f = folderPermissionsFor(p);
  const canRename = privileged || (!!f && (f.isAllEditable || f.editableFoldersId.includes(folder.id)));
  const canDelete = privileged || !!p.dataSourceFolderDelete;
  const multiBranch = git.enabled && git.multiBranch;
  return {
    rename: canRename && !multiBranch,
    delete: canDelete && !(multiBranch && folder.hasDataSourcesOnAnyBranch),
    pin: true,
  };
}

// Mirrors folder-data-sources/service.ts filterFoldersByPermissions as a SQL predicate.
export function resolveFolderAccess(p: UserPermissions, userId: string): DataSourceFolderAccess {
  if (isAdmin(p)) return { kind: 'all' };
  const f = folderPermissionsFor(p);
  if (!f || f.isAllEditable || f.isAllViewable) return { kind: 'all' };
  const folderIds = [...new Set([...f.editableFoldersId, ...f.viewableFoldersId])];
  return { kind: 'granted', folderIds, userId };
}

export function folderVisibilityPredicate(access: DataSourceFolderAccess, alias: string, params: SqlParams): string {
  switch (access.kind) {
    case 'all':
      return 'TRUE';
    case 'granted':
      return `(${alias}.id = ANY(${params.add(access.folderIds)}::uuid[]) OR ${alias}.owner_id = ${params.add(access.userId)} OR ${alias}.data_source_count > 0)`;
  }
}
