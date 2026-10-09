import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { resourceTypeForAppType } from './resource-type';

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
    const isModule = appType === APP_TYPES.MODULE;
    const isWorkflow = appType === APP_TYPES.WORKFLOW;
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;

    // Modules and workflows resolve via their own granular-permission buckets, not the
    // front-end app bucket. Must match FeatureAbilityGuard.getResource, which decides which
    // bucket is populated — reading a bucket the guard never requested yields undefined and
    // denies every non-admin request for that type.
    const userAppGitPermissions = userPermission?.[resourceTypeForAppType(appType)];
    const isAllAppsEditable = !!userAppGitPermissions?.isAllEditable;
    const isAllAppsCreatable = !!(isModule
      ? userPermission?.moduleCreate
      : isWorkflow
        ? userPermission?.workflowCreate
        : userPermission?.appCreate);
    // Per-resource id allowlist is named per type on the permissions object.
    const editableIds = isWorkflow ? userAppGitPermissions?.editableWorkflowsId : userAppGitPermissions?.editableAppsId;

    // Used for public endpoint to get the app configs
    can(FEATURE_KEY.GIT_FETCH_APP_CONFIGS, App);

    can(FEATURE_KEY.GET_ALL_BRANCHES, App);
    can(FEATURE_KEY.CREATE_BRANCH, App);
    can(FEATURE_KEY.FETCH_PULL_REQUESTS, App);
    // Grant feature-level access based on resource actions
    if (isAdmin || superAdmin) {
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
    if (isAllAppsEditable || (editableIds?.length && appId && editableIds.includes(appId))) {
      can(FEATURE_KEY.GIT_UPDATE_APP, App);
      can(FEATURE_KEY.GIT_SYNC_APP, App);
      can(FEATURE_KEY.GIT_APP_VERSION_RENAME, App);
      can(FEATURE_KEY.GIT_GET_APP, App); // Used for syncing data from inside the application so only users with edit permission can perform the operation
      can(FEATURE_KEY.GIT_GET_APP_BY_NAME, App); // Used for syncing data from inside the application using app name
      can(FEATURE_KEY.GIT_GET_APP_CONFIG, App);
    }

    // Additional checks based on specific actions
    if (editableIds?.length && appId && editableIds.includes(appId)) {
      can(FEATURE_KEY.GIT_GET_APP_CONFIG, App);
    }
  }
}
