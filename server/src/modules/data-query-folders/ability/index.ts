import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { DataQueryFolder } from '@entities/data_query_folder.entity';

type Subjects = InferSubjects<typeof DataQueryFolder> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return DataQueryFolder;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin, isBuilder } = UserAllPermissions;

    if (superAdmin || isAdmin || isBuilder) {
      can(
        [FEATURE_KEY.CREATE, FEATURE_KEY.GET, FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE, FEATURE_KEY.REORDER],
        DataQueryFolder
      );
      return;
    }

    can([FEATURE_KEY.GET], DataQueryFolder);
  }
}
