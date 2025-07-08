import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { AppGitSync } from '@entities/app_git_sync.entity';

type Subjects = InferSubjects<typeof AppGitSync> | 'all';
export type AppGitAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return AppGitSync;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<AppGitAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    const appId = request?.tj_resource_id;
    const { superAdmin, isAdmin, isBuilder, userPermission } = UserAllPermissions;

    const userAppGitPermissions = userPermission?.APP;
    const isAllAppsEditable = !!userAppGitPermissions?.isAllEditable;
    const isAllAppsCreatable = !!userPermission?.appCreate;
    const isAllAppsViewable = !!userAppGitPermissions?.isAllViewable;
    // Grant feature-level access based on resource actions
    if (isAdmin || superAdmin || isBuilder) {
      // Admin or Super Admin gets full access to all features
      can(FEATURE_KEY.GIT_CREATE_APP, AppGitSync);
      can(FEATURE_KEY.GIT_UPDATE_APP, AppGitSync);
      can(FEATURE_KEY.GIT_GET_APPS, AppGitSync);
      can(FEATURE_KEY.GIT_GET_APP, AppGitSync);
      can(FEATURE_KEY.GIT_GET_APP_CONFIG, AppGitSync);
      can(FEATURE_KEY.GIT_SYNC_APP, AppGitSync);
      can(FEATURE_KEY.GIT_APP_VERSION_RENAME, AppGitSync);
      can(FEATURE_KEY.GIT_APP_CONFIGS_UPDATE, AppGitSync);
      can(FEATURE_KEY.GIT_FETCH_APP_CONFIGS, AppGitSync);
      return;
    }

    // READ-based features
    if (
      isAllAppsViewable ||
      (userAppGitPermissions?.viewableAppsId?.length && appId && userAppGitPermissions?.viewableAppsId?.includes(appId))
    ) {
      can(FEATURE_KEY.GIT_GET_APPS, AppGitSync);
      can(FEATURE_KEY.GIT_GET_APP, AppGitSync);
    }

    // CREATE-based features
    if (isAllAppsCreatable) {
      can(FEATURE_KEY.GIT_CREATE_APP, AppGitSync);
    }

    // UPDATE-based features
    if (
      isAllAppsEditable ||
      (userAppGitPermissions?.editableAppsId?.length && appId && userAppGitPermissions.editableAppsId.includes(appId))
    ) {
      can(FEATURE_KEY.GIT_UPDATE_APP, AppGitSync);
      can(FEATURE_KEY.GIT_SYNC_APP, AppGitSync);
    }

    // Additional checks based on specific actions
    if (
      userAppGitPermissions?.editableAppsId?.length &&
      appId &&
      userAppGitPermissions.editableAppsId.includes(appId)
    ) {
      can(FEATURE_KEY.GIT_GET_APP_CONFIG, AppGitSync);
    }
  }
}
