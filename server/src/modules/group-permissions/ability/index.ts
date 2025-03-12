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
      can(
        [
          FEATURE_KEY.ADD_GROUP_USER,
          FEATURE_KEY.CREATE,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.DELETE_GROUP_USER,
          FEATURE_KEY.DUPLICATE,
          FEATURE_KEY.GET_ADDABLE_USERS,
          FEATURE_KEY.GET_ONE,
          FEATURE_KEY.GET_ALL,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.GET_ALL_GROUP_USER,
          FEATURE_KEY.DELETE_GRANULAR_PERMISSIONS,
          FEATURE_KEY.CREATE_GRANULAR_PERMISSIONS,
          FEATURE_KEY.GET_ALL_GRANULAR_PERMISSIONS,
          FEATURE_KEY.GET_ADDABLE_APPS,
          FEATURE_KEY.UPDATE_GRANULAR_PERMISSIONS,
          FEATURE_KEY.GET_ADDABLE_DS,
          FEATURE_KEY.USER_ROLE_CHANGE,
        ],
        GroupPermissions
      );
    }
  }
}
