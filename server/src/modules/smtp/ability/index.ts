import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { InstanceSettings } from '@entities/instance_settings.entity';

type Subjects = InferSubjects<typeof InstanceSettings> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return InstanceSettings;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin } = UserAllPermissions;
    if (superAdmin) {
      //Only Super admin can do operations
      can([FEATURE_KEY.GET, FEATURE_KEY.UPDATE, FEATURE_KEY.UPDATE_ENV, FEATURE_KEY.UPDATE_STATUS], InstanceSettings);
    }
  }
}
