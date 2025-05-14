import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { User } from '@entities/user.entity';

type Subjects = InferSubjects<typeof User> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return User;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin } = UserAllPermissions;
    can([FEATURE_KEY.GET_SIGNUP_ONBOARDING_SESSION, FEATURE_KEY.FINISH_ONBOARDING], User);
    if (superAdmin) {
      // Admin or super admin and do all operations
      can(
        [
          FEATURE_KEY.GET_ONBOARDING_SESSION,
          FEATURE_KEY.REQUEST_TRIAL,
          FEATURE_KEY.TRIAL_DECLINED,
          FEATURE_KEY.ACTIVATE_TRIAL,
        ],
        User
      );
    }
  }
}
