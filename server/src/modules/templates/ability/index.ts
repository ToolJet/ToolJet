import { InferSubjects, Ability, AbilityBuilder } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { App } from '@entities/app.entity';
import { FEATURE_KEY } from '../constants';
import { Injectable } from '@nestjs/common';
import { UserAllPermissions } from '@modules/app/types';

type Subjects = InferSubjects<typeof App> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return App;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;
    const isAllAppsCreatable = !!userPermission?.appCreate;

    if (isAdmin || superAdmin || isAllAppsCreatable) {
      can([FEATURE_KEY.CREATE_LIBRARY_APP, FEATURE_KEY.CREATE_SAMPLE_APP, FEATURE_KEY.CREATE_SAMPLE_ONBOARD_APP], App);
    }
  }
}
