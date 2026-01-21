import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { Folder } from '@entities/folder.entity';
type Subjects = InferSubjects<typeof Folder> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

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
    const { superAdmin, userPermission, isAdmin, user } = UserAllPermissions;
    const canCreateFolder = userPermission.folderCreate;
    const canDeleteFolder = userPermission.folderDelete;

    if (superAdmin || isAdmin) {
      can([FEATURE_KEY.CREATE_FOLDER, FEATURE_KEY.DELETE_FOLDER, FEATURE_KEY.UPDATE_FOLDER], Folder);
    } else {
      if (canCreateFolder) {
        can([FEATURE_KEY.CREATE_FOLDER, FEATURE_KEY.UPDATE_FOLDER], Folder);
        // folder creators can delete their own folders
        can([FEATURE_KEY.DELETE_FOLDER], Folder, { createdBy: user.id });
      }
      if (canDeleteFolder) {
        can([FEATURE_KEY.DELETE_FOLDER], Folder);
      }
    }
  }
}
