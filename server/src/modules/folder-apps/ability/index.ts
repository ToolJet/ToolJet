import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { FolderApp } from '@entities/folder_app.entity';
type Subjects = InferSubjects<typeof FolderApp> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return FolderApp;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, userPermission, isAdmin } = UserAllPermissions;
    const folderPermission = userPermission.folderCRUD;
    if (superAdmin || folderPermission || isAdmin) {
      can([FEATURE_KEY.CREATE_FOLDER_APP, FEATURE_KEY.DELETE_FOLDER_APP], FolderApp);
    }
    can([FEATURE_KEY.GET_FOLDERS], FolderApp); // No permission required
  }
}
