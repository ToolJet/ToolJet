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
    can(
      [
        FEATURE_KEY.CREATE_USER,
        FEATURE_KEY.GET_ALL_USERS,
        FEATURE_KEY.GET_USER,
        FEATURE_KEY.GET_ALL_WORKSPACES,
        FEATURE_KEY.REPLACE_USER_WORKSPACES,
        FEATURE_KEY.UPDATE_USER,
        FEATURE_KEY.UPDATE_USER_ROLE,
        FEATURE_KEY.UPDATE_USER_WORKSPACE,
        FEATURE_KEY.CREATE_ORG_GIT,
        FEATURE_KEY.PULL_EXISTING_APP,
        FEATURE_KEY.PULL_NEW_APP,
        FEATURE_KEY.PUSH_APP_VERSION,
      ],
      User
    );
  }
}
