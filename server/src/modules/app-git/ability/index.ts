import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

type Subjects = InferSubjects<typeof App> | 'all';
export type AppGitAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return App;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<AppGitAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    const appId = request?.tj_resource_id;
    const appType = request?.tj_app?.type;
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;

    const userAppGitPermissions = userPermission?.[MODULES.APP];
    const isAllAppsEditable = !!userAppGitPermissions?.isAllEditable;
    const isAllAppsCreatable = !!userPermission?.appCreate;

    // Used for public endpoint to get the app configs
    can(FEATURE_KEY.GIT_FETCH_APP_CONFIGS, App);

    can(FEATURE_KEY.GET_ALL_BRANCHES, App);
    can(FEATURE_KEY.CREATE_BRANCH, App);
    can(FEATURE_KEY.FETCH_PULL_REQUESTS, App);
    // Grant feature-level access based on resource actions
    if (isAdmin || superAdmin || (appType === APP_TYPES.MODULE && UserAllPermissions.isBuilder)) {
      // Admin or Super Admin gets full access to all features
      can(FEATURE_KEY.GIT_CREATE_APP, App);
      can(FEATURE_KEY.GIT_UPDATE_APP, App);
      can(FEATURE_KEY.GIT_GET_APPS, App);
      can(FEATURE_KEY.GIT_GET_APP, App);
      can(FEATURE_KEY.GIT_GET_APP_BY_NAME, App);
      can(FEATURE_KEY.GIT_GET_APP_CONFIG, App);
      can(FEATURE_KEY.GIT_SYNC_APP, App);
      can(FEATURE_KEY.GIT_APP_VERSION_RENAME, App);
      return;
    }

    // CREATE-based features
    if (isAllAppsCreatable) {
      can(FEATURE_KEY.GIT_CREATE_APP, App);
      can(FEATURE_KEY.GIT_GET_APPS, App);
    }
    if (
      isAllAppsEditable ||
      (userAppGitPermissions?.editableAppsId?.length && appId && userAppGitPermissions.editableAppsId.includes(appId))
    ) {
      can(FEATURE_KEY.GIT_UPDATE_APP, App);
      can(FEATURE_KEY.GIT_SYNC_APP, App);
      can(FEATURE_KEY.GIT_APP_VERSION_RENAME, App);
      can(FEATURE_KEY.GIT_GET_APP, App); // Used for syncing data from inside the application so only users with edit permission can perform the operation
      can(FEATURE_KEY.GIT_GET_APP_BY_NAME, App); // Used for syncing data from inside the application using app name
      can(FEATURE_KEY.GIT_GET_APP_CONFIG, App);
    }

    // Additional checks based on specific actions
    if (
      userAppGitPermissions?.editableAppsId?.length &&
      appId &&
      userAppGitPermissions.editableAppsId.includes(appId)
    ) {
      can(FEATURE_KEY.GIT_GET_APP_CONFIG, App);
    }
  }
}
