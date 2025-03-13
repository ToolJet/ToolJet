import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { AiConversation } from '@entities/ai_conversation.entity';

type Subjects = InferSubjects<typeof AiConversation> | 'all';
export type AiAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return AiConversation;
  }

  protected defineAbilityFor(can: AbilityBuilder<AiAbility>['can'], userPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin, isBuilder } = userPermissions;

    can([FEATURE_KEY.PING], AiConversation);

    if (isAdmin || superAdmin || isBuilder) {
      can(
        [
          FEATURE_KEY.FETCH_ZERO_STATE,
          FEATURE_KEY.SEND_USER_MESSAGE,
          FEATURE_KEY.SEND_DOCS_MESSAGE,
          FEATURE_KEY.APPROVE_PRD,
          FEATURE_KEY.REGENERATE_MESSAGE,
          FEATURE_KEY.VOTE_MESSAGE,
          FEATURE_KEY.GET_CREDITS_BALANCE,
        ],
        AiConversation
      );
    }
  }
}
