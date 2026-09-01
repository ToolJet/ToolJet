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
          FEATURE_KEY.REWIND_STEP,
          FEATURE_KEY.REGENERATE_MESSAGE,
          FEATURE_KEY.VOTE_MESSAGE,
          FEATURE_KEY.GET_CREDITS_BALANCE,
          FEATURE_KEY.LIST_CONVERSATIONS,
          FEATURE_KEY.CREATE_CONVERSATION,
          FEATURE_KEY.GET_CONVERSATION,
          FEATURE_KEY.AUTO_SORT_QUERIES,
          FEATURE_KEY.GET_THREAD_TOKEN_USAGE,
          // Deliberately builder-scoped, unlike the admin-only key settings below:
          // the whole point of the preference is that it needs no admin involvement.
          FEATURE_KEY.GET_LLM_PREFERENCE,
          FEATURE_KEY.UPDATE_LLM_PREFERENCE,
        ],
        AiConversation
      );
    }

    if (isAdmin || superAdmin) {
      can([FEATURE_KEY.UPDATE_KEY], AiConversation);
      can([FEATURE_KEY.GET_KEY_SETTINGS], AiConversation);
    }
  }
}
