import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { OrganizationUser } from '@entities/organization_user.entity';
import { FEATURE_KEY } from '../constants';

type Subjects = InferSubjects<typeof OrganizationUser> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  // Specifies the type of resource this factory is concerned with
  protected getSubjectType() {
    return OrganizationUser; // Correctly setting the subject type as OrganizationUser
  }

  // Defines permissions based on the user's roles and other conditions
  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], userPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin } = userPermissions;

    if (superAdmin) {
      // Super admins can perform all actions on organization users
      can(FEATURE_KEY.SUGGEST_USERS, OrganizationUser);
      can(FEATURE_KEY.USER_INVITE, OrganizationUser);
      can(FEATURE_KEY.USER_BULK_UPLOAD, OrganizationUser);
      can(FEATURE_KEY.USER_ARCHIVE, OrganizationUser);
      can(FEATURE_KEY.USER_ARCHIVE_ALL, OrganizationUser);
      can(FEATURE_KEY.USER_UNARCHIVE_ALL, OrganizationUser);
      can(FEATURE_KEY.USER_UPDATE, OrganizationUser);
      can(FEATURE_KEY.USER_UNARCHIVE, OrganizationUser);
      can(FEATURE_KEY.VIEW_ALL_USERS, OrganizationUser);
    }

    if (isAdmin) {
      // Admins can perform these actions on users within their organization
      can(FEATURE_KEY.SUGGEST_USERS, OrganizationUser);
      can(FEATURE_KEY.USER_INVITE, OrganizationUser);
      can(FEATURE_KEY.USER_BULK_UPLOAD, OrganizationUser);
      can(FEATURE_KEY.USER_ARCHIVE, OrganizationUser);
      can(FEATURE_KEY.USER_UPDATE, OrganizationUser);
      can(FEATURE_KEY.USER_UNARCHIVE, OrganizationUser);
      can(FEATURE_KEY.VIEW_ALL_USERS, OrganizationUser);
    }

    // Regular users can only view other users in the same organization
    // can(FEATURE_KEY.VIEW_ALL_USERS, OrganizationUser);
  }
}
