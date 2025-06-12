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
    const { superAdmin, userPermission, isAdmin } = UserAllPermissions;
    const isAllAppsCreatable = !!userPermission?.appCreate;

    if (superAdmin || isAdmin || isAllAppsCreatable) {
      can([FEATURE_KEY.CREATE_MODULE], User);
    }
  }
}
