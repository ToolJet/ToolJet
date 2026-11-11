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

    // Minting is the only gated action. List and delete are open: the service scopes them to own tokens, or the whole workspace for revokers.
    // Approving a device login (`tooljet auth login`) mints a token for the approver, so it takes the same grant.
    if (isAdmin || superAdmin || userPermission?.patCreate) {
      can([FEATURE_KEY.CREATE_PAT, FEATURE_KEY.APPROVE_DEVICE_LOGIN], UserPersonalAccessToken);
    }
    // Starting and polling a device login are public routes; looking up a code only shows the client's name. An AI
    // render session is checked by the service (aiRenderSessionDenial) and grants nothing new.
    can(
      [
        FEATURE_KEY.LIST_PATS,
        FEATURE_KEY.DELETE_PAT,
        FEATURE_KEY.VALIDATE_PAT,
        FEATURE_KEY.CREATE_PAT_SESSION,
        FEATURE_KEY.CREATE_AI_RENDER_SESSION,
        FEATURE_KEY.START_DEVICE_LOGIN,
        FEATURE_KEY.POLL_DEVICE_LOGIN,
        FEATURE_KEY.LOOKUP_DEVICE_LOGIN,
      ],
      UserPersonalAccessToken
    );
  }
}
