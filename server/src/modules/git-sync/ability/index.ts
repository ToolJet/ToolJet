import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { User } from '@entities/user.entity';

type Subjects = InferSubjects<typeof User> | 'all';
export type GitSyncAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return User;
  }

  protected defineAbilityFor(can: AbilityBuilder<GitSyncAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin } = UserAllPermissions;

    if (isAdmin || superAdmin) {
      // Admin or Super Admin gets full access to all git-sync features
      can(FEATURE_KEY.GIT_SYNC_GET_ORG_GIT, 'all');
      can(FEATURE_KEY.GIT_SYNC_GET_ORG_GIT_STATUS, 'all');
      can(FEATURE_KEY.GIT_SYNC_CREATE_ORG_GIT, 'all');
      can(FEATURE_KEY.GIT_SYNC_UPDATE_ORG_GIT, 'all');
      can(FEATURE_KEY.GIT_SYNC_FINALIZE_ORG_GIT, 'all');
      can(FEATURE_KEY.GIT_SYNC_CHANGE_STATUS, 'all');
      can(FEATURE_KEY.GIT_SYNC_DELETE_ORG_GIT, 'all');
      return;
    }

    // Add additional permission checks here for non-admin users if needed
  }
}
