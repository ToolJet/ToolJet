import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';

type Subjects = InferSubjects<typeof UserPersonalAccessToken> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return UserPersonalAccessToken;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;

    // Minting is the only gated action: listing and deleting are scoped to the caller's own tokens in the service.
    if (isAdmin || superAdmin || userPermission?.patCreate) {
      can(FEATURE_KEY.CREATE_PAT, UserPersonalAccessToken);
    }
    can(
      [FEATURE_KEY.LIST_PATS, FEATURE_KEY.DELETE_PAT, FEATURE_KEY.VALIDATE_PAT, FEATURE_KEY.CREATE_PAT_SESSION],
      UserPersonalAccessToken
    );
  }
}
