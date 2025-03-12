import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { CustomStyles } from '@entities/custom_styles.entity';
type Subjects = InferSubjects<typeof CustomStyles> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return CustomStyles;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin } = UserAllPermissions;
    if (superAdmin || isAdmin) {
      can([FEATURE_KEY.SAVE_CUSTOM_STYLES], CustomStyles);
    }
    can(
      [FEATURE_KEY.GET_CUSTOM_STYLES, FEATURE_KEY.GET_CUSTOM_STYLES_FROM_APP, FEATURE_KEY.GET_CUSTOM_STYLES_FOR_APP],
      CustomStyles
    );
  }
}
