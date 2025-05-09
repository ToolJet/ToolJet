import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { GroupPermissions } from '@entities/group_permissions.entity';

type Subjects = InferSubjects<typeof GroupPermissions> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return GroupPermissions;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin } = UserAllPermissions;
    if (superAdmin || isAdmin) {
      // Admin or super admin and do all operations
      can([FEATURE_KEY.SOME_FEATURE], GroupPermissions);
    }
  }
}
