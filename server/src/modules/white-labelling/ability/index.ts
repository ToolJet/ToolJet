import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { WhiteLabelling } from '@entities/white_labelling.entity';
import { FEATURE_KEY } from '../constant';

type Subjects = InferSubjects<typeof WhiteLabelling> | 'all';
export type WhiteLabellingAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return WhiteLabelling;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<WhiteLabellingAbility>['can'],
    userPermissions: UserAllPermissions
  ): void {
    const { superAdmin, isAdmin } = userPermissions;

    // The instance branding row has no workspace, so changing it affects every workspace.
    if (superAdmin) {
      can(FEATURE_KEY.UPDATE, WhiteLabelling);
    }
    if (isAdmin || superAdmin) {
      can(FEATURE_KEY.UPDATE_ORGANIZATION_WHITE_LABELS, WhiteLabelling);
    }
    // All users can perform these actions
    can([FEATURE_KEY.GET, FEATURE_KEY.GET_ORGANIZATION_WHITE_LABELS], WhiteLabelling);
  }
}
