import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { AppHistory } from '@entities/app_history.entity';
import { FEATURE_KEY } from '@modules/app-history/constants';
import { UserAllPermissions } from '@modules/app/types';

type Subjects = InferSubjects<typeof AppHistory> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return AppHistory;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], userPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin, isBuilder } = userPermissions;

    if (isAdmin || superAdmin || isBuilder) {
      can([FEATURE_KEY.LIST_HISTORY, FEATURE_KEY.RESTORE_HISTORY, FEATURE_KEY.UPDATE_DESCRIPTION], AppHistory);
    }
  }
}