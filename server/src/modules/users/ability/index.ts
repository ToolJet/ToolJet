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
    if (superAdmin) {
      can(
        [
          FEATURE_KEY.AUTO_UPDATE_USER_PASSWORD,
          FEATURE_KEY.CHANGE_USER_PASSWORD,
          FEATURE_KEY.GET_ALL_USERS,
          FEATURE_KEY.UPDATE_USER_TYPE,
        ],
        User
      );
    }
  }
}
