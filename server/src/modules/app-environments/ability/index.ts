import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { AppEnvironment } from '@entities/app_environments.entity';

type Subjects = InferSubjects<typeof AppEnvironment> | 'all';
export type AppEnvironmentAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return AppEnvironment;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<AppEnvironmentAbility>['can'],
    userPermissions: UserAllPermissions
  ): void {
    const { superAdmin, isAdmin, isBuilder } = userPermissions;

    can([FEATURE_KEY.GET_DEFAULT], AppEnvironment);

    if (isAdmin || superAdmin || isBuilder) {
      can(
        [
          FEATURE_KEY.INIT,
          FEATURE_KEY.POST_ACTION,
          FEATURE_KEY.GET_ALL,
          FEATURE_KEY.GET_VERSIONS_BY_ENVIRONMENT,
          FEATURE_KEY.GET_BY_ID,
          FEATURE_KEY.CREATE,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.DELETE,
        ],
        AppEnvironment
      );
    }
  }
}
