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
    const canCreateDataSourceFolder = userPermission.dataSourceFolderCreate;
    const canDeleteDataSourceFolder = userPermission.dataSourceFolderDelete;

    if (superAdmin || isAdmin) {
      can(
        [
          FEATURE_KEY.CREATE_DATA_SOURCE_FOLDER,
          FEATURE_KEY.UPDATE_DATA_SOURCE_FOLDER,
          FEATURE_KEY.DELETE_DATA_SOURCE_FOLDER,
          FEATURE_KEY.ADD_DATA_SOURCE_TO_FOLDER,
          FEATURE_KEY.REMOVE_DATA_SOURCE_FROM_FOLDER,
          FEATURE_KEY.BULK_MOVE_DATA_SOURCES,
        ],
        Folder
      );
    } else {
      if (canCreateDataSourceFolder) {
        can([FEATURE_KEY.CREATE_DATA_SOURCE_FOLDER], Folder);
      }
      if (canDeleteDataSourceFolder) {
        can([FEATURE_KEY.DELETE_DATA_SOURCE_FOLDER], Folder);
      }
      if (canCreateDataSourceFolder || canDeleteDataSourceFolder) {
        can(
          [FEATURE_KEY.UPDATE_DATA_SOURCE_FOLDER, FEATURE_KEY.ADD_DATA_SOURCE_TO_FOLDER, FEATURE_KEY.REMOVE_DATA_SOURCE_FROM_FOLDER, FEATURE_KEY.BULK_MOVE_DATA_SOURCES],
          Folder
        );
      }
    }
    // Listing is available to all authenticated users
    can([FEATURE_KEY.GET_DATA_SOURCE_FOLDERS, FEATURE_KEY.GET_DATA_SOURCES_IN_FOLDER], Folder);
  }
}
