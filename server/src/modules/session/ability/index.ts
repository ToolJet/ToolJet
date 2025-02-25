import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { UserSessions } from '@entities/user_sessions.entity';

type Subjects = InferSubjects<typeof UserSessions> | 'all';
export type OrganizationAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return UserSessions;
  }

  protected async defineAbilityFor(
    can: AbilityBuilder<OrganizationAbility>['can'],
    UserAllPermissions: UserAllPermissions
  ): Promise<void> {
    can([FEATURE_KEY.LOG_OUT, FEATURE_KEY.GET_INVITED_USER_SESSION, FEATURE_KEY.GET_USER_SESSION], UserSessions);
  }
}
