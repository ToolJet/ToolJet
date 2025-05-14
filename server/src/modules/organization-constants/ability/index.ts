import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { OrganizationConstant } from '@entities/organization_constants.entity';

type Subjects = InferSubjects<typeof OrganizationConstant> | 'all';
export type OrganizationConstantAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return OrganizationConstant;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<OrganizationConstantAbility>['can'],
    userPermissions: UserAllPermissions
  ): void {
    const { superAdmin, isAdmin, userPermission } = userPermissions;
    const orgConstantPermission = userPermission?.orgConstantCRUD;

    // If the user has organization constant permission
    if (isAdmin || superAdmin || orgConstantPermission) {
      can(
        [FEATURE_KEY.CREATE, FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE, FEATURE_KEY.GET_DECRYPTED_CONSTANTS],
        OrganizationConstant
      );
    }

    // All users can view constants
    can(
      [
        FEATURE_KEY.GET,
        FEATURE_KEY.GET_PUBLIC,
        FEATURE_KEY.GET_FROM_APP,
        FEATURE_KEY.GET_FROM_ENVIRONMENT,
        FEATURE_KEY.GET_SECRETS,
      ],
      OrganizationConstant
    );
  }
}
