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

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], userAllPermissions: UserAllPermissions): void {
    const { superAdmin, userPermission, isAdmin } = userAllPermissions;
    const dsFolderPermission = userPermission.dataSourceFolderCRUD;
    if (superAdmin || dsFolderPermission || isAdmin) {
      can(
        [
          FEATURE_KEY.CREATE_DS_FOLDER,
          FEATURE_KEY.UPDATE_DS_FOLDER,
          FEATURE_KEY.DELETE_DS_FOLDER,
          FEATURE_KEY.ADD_DS_TO_FOLDER,
          FEATURE_KEY.REMOVE_DS_FROM_FOLDER,
          FEATURE_KEY.BULK_MOVE_DS,
        ],
        Folder
      );
    }
    // Listing is available to all authenticated users
    can([FEATURE_KEY.GET_DS_FOLDERS, FEATURE_KEY.GET_DS_IN_FOLDER], Folder);
  }
}
