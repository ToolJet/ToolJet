import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { UserPermissions } from '@modules/ability/types';
import { FEATURE_KEY, DATA_SOURCE_FOLDER_TYPE } from '../constants';
import { Folder } from '@entities/folder.entity';
import { APP_TYPES } from '@modules/apps/constants';
type Subjects = InferSubjects<typeof Folder> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

// Folder-flavor (folder.type) → the create/delete permission keys that gate it. Keyed by the raw
// folder `type` string: app folders use APP_TYPES values, data-source folders use
// DATA_SOURCE_FOLDER_TYPE (not an app type). Add an entry here (not another ternary arm) when a new
// folder-owning resource type is introduced. Front-end folders fall through to folderCreate/Delete.
const FOLDER_PERMISSION_KEYS_BY_TYPE: Partial<
  Record<string, { create: keyof UserPermissions; delete: keyof UserPermissions }>
> = {
  [APP_TYPES.WORKFLOW]: { create: 'workflowFolderCreate', delete: 'workflowFolderDelete' },
  [APP_TYPES.MODULE]: { create: 'moduleFolderCreate', delete: 'moduleFolderDelete' },
  [DATA_SOURCE_FOLDER_TYPE]: { create: 'dataSourceFolderCreate', delete: 'dataSourceFolderDelete' },
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

      // UPDATE_FOLDER (rename) requires granular canEditFolder permission or folder ownership.
      // This is a coarse guard — the service enforces the per-folder granular check.
      if (isBuilder || canCreateFolder) {
        can([FEATURE_KEY.UPDATE_FOLDER], Folder);
      }
    }
  }
}
