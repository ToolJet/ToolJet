import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../../constants';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbility } from './index';

export function defineDataQueryAppAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  app: App,
  folderId?: string
): void {
  const appId = app?.id;
  const { superAdmin, isAdmin, userPermission, isBuilder } = UserAllPermissions;
  const resourcePermissions = userPermission?.[MODULES.APP];
  const folderPermissions = userPermission?.[MODULES.FOLDER];
  const isAllEditable = !!resourcePermissions?.isAllEditable;
  const isCanCreate = userPermission.appCreate;
  const isCanDelete = userPermission.appDelete;
  const isAllViewable = !!resourcePermissions?.isAllViewable;
  const resourceType = UserAllPermissions?.resource[0]?.resourceType;

  console.log(`DQ request.tj_folder: ${folderId}`);

  // App's folder ID from ValidSlugGuard → tj_folder
  const appFolderId: string | undefined = folderId;

  // Folder-level permission checks
  const hasFolderEditAccess =
    !!appFolderId &&
    (folderPermissions?.isAllEditable ||
      folderPermissions?.isAllEditApps ||
      folderPermissions?.editableFoldersId?.includes(appFolderId) ||
      folderPermissions?.editAppsInFoldersId?.includes(appFolderId));

  const hasFolderViewAccess =
    !!appFolderId && (folderPermissions?.isAllViewable || folderPermissions?.viewableFoldersId?.includes(appFolderId));

  console.log(`hasFolderEditAccess: ${hasFolderEditAccess}, hasFolderViewAccess: ${hasFolderViewAccess}`);

  if (app?.isPublic) {
    can([FEATURE_KEY.RUN_VIEWER], App);
  }

  if (isAdmin || superAdmin || (resourceType === MODULES.MODULES && isBuilder)) {
    can(
      [
        FEATURE_KEY.CREATE,
        FEATURE_KEY.GET,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.DELETE,
        FEATURE_KEY.UPDATE_DATA_SOURCE,
        FEATURE_KEY.UPDATE_ONE,
        FEATURE_KEY.RUN_EDITOR,
        FEATURE_KEY.RUN_VIEWER,
        FEATURE_KEY.PREVIEW,
      ],
      App
    );
    return;
  }

  if (isAllEditable || isCanCreate || isCanDelete || hasFolderEditAccess) {
    can(
      [
        FEATURE_KEY.GET,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.UPDATE_DATA_SOURCE,
        FEATURE_KEY.UPDATE_ONE,
        FEATURE_KEY.RUN_EDITOR,
        FEATURE_KEY.RUN_VIEWER,
        FEATURE_KEY.PREVIEW,
        FEATURE_KEY.DELETE,
        FEATURE_KEY.CREATE,
      ],
      App
    );
    return;
  }

  if (resourcePermissions?.editableAppsId?.length && appId && resourcePermissions?.editableAppsId?.includes(appId)) {
    can(
      [
        FEATURE_KEY.GET,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.UPDATE_DATA_SOURCE,
        FEATURE_KEY.UPDATE_ONE,
        FEATURE_KEY.RUN_EDITOR,
        FEATURE_KEY.RUN_VIEWER,
        FEATURE_KEY.PREVIEW,
        FEATURE_KEY.DELETE,
        FEATURE_KEY.CREATE,
      ],
      App
    );
    return;
  }

  if (isAllViewable || hasFolderViewAccess) {
    can([FEATURE_KEY.GET, FEATURE_KEY.RUN_VIEWER, FEATURE_KEY.RUN_EDITOR], App);
    return;
  }

  if (
    (resourcePermissions?.viewableAppsId?.length && appId && resourcePermissions?.viewableAppsId?.includes(appId)) ||
    hasFolderViewAccess
  ) {
    can([FEATURE_KEY.GET, FEATURE_KEY.RUN_VIEWER, FEATURE_KEY.RUN_EDITOR], App);
    return;
  }
}
