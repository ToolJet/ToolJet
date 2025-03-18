import { InferSubjects, Ability, AbilityBuilder } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { DataSource } from '@entities/data_source.entity';
import { FEATURE_KEY } from '../../constants';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';

type Subjects = InferSubjects<typeof DataSource> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return DataSource;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions) {
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;
    const canCreateDataSource = isAdmin || superAdmin || userPermission.dataSourceCreate;

    if (canCreateDataSource) {
      can([FEATURE_KEY.APP_RESOURCE_IMPORT, FEATURE_KEY.APP_RESOURCE_CLONE], DataSource);
    }
  }
}
