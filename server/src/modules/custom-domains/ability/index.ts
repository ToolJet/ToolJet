import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { CustomDomain } from '@entities/custom_domain.entity';
import { FEATURE_KEY } from '../constant';

type Subjects = InferSubjects<typeof CustomDomain> | 'all';
export type CustomDomainAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return CustomDomain;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<CustomDomainAbility>['can'],
    userPermissions: UserAllPermissions
  ): void {
    const { superAdmin, isAdmin } = userPermissions;

    if (isAdmin || superAdmin) {
      can([FEATURE_KEY.CREATE, FEATURE_KEY.VERIFY, FEATURE_KEY.DELETE, FEATURE_KEY.STATUS], CustomDomain);
    }
    // All authenticated users can GET
    can([FEATURE_KEY.GET], CustomDomain);
  }
}
