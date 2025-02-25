import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { Plugin } from '@entities/plugin.entity';

type Subjects = InferSubjects<typeof Plugin> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return Plugin;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin } = UserAllPermissions;
    if (superAdmin || isAdmin) {
      // Admin or super admin and do all operations
      can([FEATURE_KEY.INSTALL, FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE], Plugin);
    }
    // These two operations are available to all
    can([FEATURE_KEY.GET_ONE, FEATURE_KEY.RELOAD, FEATURE_KEY.GET], Plugin);
  }
}
