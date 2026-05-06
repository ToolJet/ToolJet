import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constant';
import { InstanceSettings } from '@entities/instance_settings.entity';

type Subjects = InferSubjects<typeof InstanceSettings> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return InstanceSettings;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    userPermissions: UserAllPermissions
  ): void {
    const { superAdmin } = userPermissions;
    if (superAdmin) {
      can(
        [
          FEATURE_KEY.GET,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.VALIDATE,
          FEATURE_KEY.ACQUIRE_CERTIFICATE,
          FEATURE_KEY.CERTIFICATE_STATUS,
          FEATURE_KEY.RENEW_CERTIFICATE,
          FEATURE_KEY.REQUEST_DOMAIN_CHANGE,
          FEATURE_KEY.CANCEL_DOMAIN_CHANGE,
        ],
        InstanceSettings
      );
    }
  }
}
