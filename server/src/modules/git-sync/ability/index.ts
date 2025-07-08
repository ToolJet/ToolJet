import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';

type Subjects = InferSubjects<typeof OrganizationGitSync> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return OrganizationGitSync;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    // const appId = request?.tj_resource_id;
    // const { superAdmin, isAdmin, isBuilder, userPermission } = UserAllPermissions;

    // const userAppGitPermissions = userPermission?.APP;
    // const isAllAppsEditable = !!userAppGitPermissions?.isAllEditable;
    // const isAllAppsCreatable = !!userPermission?.appCreate;
    // const isAllAppsViewable = !!userAppGitPermissions?.isAllViewable;
    // Grant feature-level access based on resource actions

    const { superAdmin, isAdmin } = UserAllPermissions;
    if (isAdmin || superAdmin) {
      // Admin or Super Admin gets full access to all features
      can(FEATURE_KEY.GET_ORGANIZATION_GIT, OrganizationGitSync);
      can(FEATURE_KEY.GET_ORGANIZATION_GIT_STATUS, OrganizationGitSync);
      can(FEATURE_KEY.CREATE_ORGANIZATION_GIT, OrganizationGitSync);
      can(FEATURE_KEY.SAVE_PROVIDER_CONFIGS, OrganizationGitSync);
      can(FEATURE_KEY.FINALIZE_CONFIGS, OrganizationGitSync);
      can(FEATURE_KEY.UPDATE_PROVIDER_CONFIGS, OrganizationGitSync);
      can(FEATURE_KEY.UPDATE_ORGANIZATION_GIT_STATUS, OrganizationGitSync);
      can(FEATURE_KEY.DELETE_ORGANIZATION_GIT_CONFIGS, OrganizationGitSync);
      return;
    }
    can(FEATURE_KEY.GET_ORGANIZATION_GIT_STATUS, OrganizationGitSync);
  }
}
