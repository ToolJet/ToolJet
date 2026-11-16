import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { UserPermissions } from '@modules/ability/types';
import { FEATURE_KEY, DATA_SOURCE_FOLDER_TYPE } from '../constants';
import { Folder } from '@entities/folder.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { MODULES } from '@modules/app/constants/modules';
type Subjects = InferSubjects<typeof Folder> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

// Folder-flavor (folder.type) → the create/delete permission keys and the granular-permission
// bucket that gate it. Keyed by the raw folder `type` string: app folders use APP_TYPES values,
// data-source folders use DATA_SOURCE_FOLDER_TYPE (not an app type). Add an entry here (not
// another ternary arm) when a new folder-owning resource type is introduced. Front-end folders
// fall through to folderCreate/Delete + MODULES.FOLDER. Mirrors folders/service.ts's
// FOLDER_PERMISSION_BY_TYPE, which needs the same resourceType for its own granular check.
const FOLDER_PERMISSION_KEYS_BY_TYPE: Partial<
  Record<string, { create: keyof UserPermissions; delete: keyof UserPermissions; resourceType: MODULES }>
> = {
  [APP_TYPES.WORKFLOW]: {
    create: 'workflowFolderCreate',
    delete: 'workflowFolderDelete',
    resourceType: MODULES.WORKFLOW_FOLDER,
  },
  [APP_TYPES.MODULE]: {
    create: 'moduleFolderCreate',
    delete: 'moduleFolderDelete',
    resourceType: MODULES.MODULE_FOLDER,
  },
  [DATA_SOURCE_FOLDER_TYPE]: {
    create: 'dataSourceFolderCreate',
    delete: 'dataSourceFolderDelete',
    resourceType: MODULES.DATA_SOURCE_FOLDER,
  },
};

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return Folder;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    const { superAdmin, userPermission, isAdmin, isBuilder } = UserAllPermissions;
    const permissionKeys = FOLDER_PERMISSION_KEYS_BY_TYPE[request?.tj_folder_type];
    const canCreateFolder = permissionKeys ? !!userPermission[permissionKeys.create] : userPermission.folderCreate;
    const canDeleteFolder = permissionKeys ? !!userPermission[permissionKeys.delete] : userPermission.folderDelete;
    const ownerCanManageFolder = !!request?.tj_allow_owner_folder_manage;

    // A granular "Edit folder" grant (isAll, or scoped to this specific folder id) must let a
    // non-builder, non-coarse-flag user through here too — otherwise the whole point of a
    // per-folder canEditFolder grant is defeated: the request never reaches
    // FoldersService.checkFolderManagePermission's own (correct) per-folder check at all.
    const folderPermissions = userPermission[permissionKeys?.resourceType ?? MODULES.FOLDER];
    const folderId = request?.tj_resource_id;
    const hasGranularEditGrant =
      !!folderPermissions?.isAllEditable || (!!folderId && !!folderPermissions?.editableFoldersId?.includes(folderId));

    if (superAdmin || isAdmin) {
      can([FEATURE_KEY.CREATE_FOLDER, FEATURE_KEY.DELETE_FOLDER, FEATURE_KEY.UPDATE_FOLDER], Folder);
    } else {
      if (canCreateFolder) {
        can([FEATURE_KEY.CREATE_FOLDER], Folder);
      }

      if (ownerCanManageFolder) {
        can([FEATURE_KEY.UPDATE_FOLDER, FEATURE_KEY.DELETE_FOLDER], Folder);
      }

      if (canDeleteFolder) {
        can([FEATURE_KEY.DELETE_FOLDER], Folder);
      }

      // UPDATE_FOLDER (rename): a builder, the coarse create flag, or a granular canEditFolder
      // grant (checked above) each independently authorize getting past this guard;
      // FoldersService.checkFolderManagePermission still re-does the exact per-folder check.
      if (isBuilder || canCreateFolder || hasGranularEditGrant) {
        can([FEATURE_KEY.UPDATE_FOLDER], Folder);
      }
    }
  }
}
