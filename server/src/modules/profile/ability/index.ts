import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { User } from '@entities/user.entity';

type Subjects = InferSubjects<typeof User> | 'all';
export type OrganizationAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return User;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<OrganizationAbility>['can'],
    UserAllPermissions: UserAllPermissions
  ): void {
    // All Operations are available for all users
    can([FEATURE_KEY.UPDATE, FEATURE_KEY.GET, FEATURE_KEY.UPDATE_AVATAR, FEATURE_KEY.UPDATE_PASSWORD], User);
    return;
  }
}
