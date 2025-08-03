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
    const { superAdmin, isAdmin, isBuilder } = UserAllPermissions;

    if (superAdmin || isAdmin || isBuilder) {
      can(
        [
          FEATURE_KEY.CREATE_MODULE,
          FEATURE_KEY.DELETE_MODULE,
          FEATURE_KEY.CLONE_MODULE,
          FEATURE_KEY.EXORT_MODULE,
          FEATURE_KEY.IMPORT_MODULE,
          FEATURE_KEY.UPDATE_MODULE,
        ],
        User
      );
    }
  }
}
