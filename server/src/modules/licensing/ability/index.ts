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
    const { superAdmin, isAdmin } = UserAllPermissions;
    can([FEATURE_KEY.GET_PLANS, FEATURE_KEY.GET_ACCESS, FEATURE_KEY.GET_APP_LIMITS], InstanceSettings);
    if (superAdmin) {
      // super admin can do all operations
      can(
        [FEATURE_KEY.GET_DOMAINS, FEATURE_KEY.GET_TERMS, FEATURE_KEY.UPDATE_LICENSE, FEATURE_KEY.GET_LICENSE],
        InstanceSettings
      );
    }

    if (superAdmin || isAdmin) {
      can(
        [
          FEATURE_KEY.CHECK_AUDIT_LOGS_LICENSE,
          FEATURE_KEY.GET_AUDIT_LOGS_MAX_DURATION,
          FEATURE_KEY.GET_ORGANIZATION_LIMITS,
          FEATURE_KEY.GET_USER_LIMITS,
          FEATURE_KEY.GET_WORKFLOW_LIMITS,
        ],
        InstanceSettings
      );
    }
  }
}
