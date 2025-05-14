import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { Organization } from '@entities/organization.entity';

type Subjects = InferSubjects<typeof Organization> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return Organization;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    can([FEATURE_KEY.GET_PUBLIC_CONFIGS, FEATURE_KEY.GET_INSTANCE_SSO], Organization);

    if (UserAllPermissions.isAdmin) {
      can(
        [
          FEATURE_KEY.GET_ORGANIZATION_CONFIGS,
          FEATURE_KEY.UPDATE_ORGANIZATION_SSO,
          FEATURE_KEY.UPDATE_ORGANIZATION_GENERAL_CONFIGS,
        ],
        Organization
      );
    }

    if (UserAllPermissions.superAdmin) {
      can([FEATURE_KEY.UPDATE_INSTANCE_SSO, FEATURE_KEY.UPDATE_INSTANCE_GENERAL_CONFIGS], Organization);
    }
  }
}
