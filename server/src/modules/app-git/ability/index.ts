import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';

type Subjects = InferSubjects<typeof App> | 'all';
export type AppGitAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class AppGitAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
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
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;

    const userAppGitPermissions = userPermission?.APP;
    const isAllAppsEditable = !!userAppGitPermissions?.isAllEditable;
    const isAllAppsCreatable = !!userPermission?.appCreate;
    const isAllAppsViewable = !!userAppGitPermissions?.isAllViewable;

    // Grant feature-level access based on resource actions
    if (isAdmin || superAdmin) {
      // Admin or Super Admin gets full access to all features
      can(FEATURE_KEY.GIT_CREATE_APP, App);
      can(FEATURE_KEY.GIT_UPDATE_APP, App);
      can(FEATURE_KEY.GIT_GET_APPS, App);
      can(FEATURE_KEY.GIT_GET_APP, App);
      can(FEATURE_KEY.GIT_GET_APP_CONFIG, App);
      can(FEATURE_KEY.GIT_SYNC_APP, App);
      return;
    }

    // READ-based features
    if (
      isAllAppsViewable ||
      (userAppGitPermissions?.viewableAppsId?.length && appId && userAppGitPermissions?.viewableAppsId?.includes(appId))
    ) {
      can(FEATURE_KEY.GIT_GET_APPS, App);
      can(FEATURE_KEY.GIT_GET_APP, App);
    }

    // CREATE-based features
    if (isAllAppsCreatable) {
      can(FEATURE_KEY.GIT_CREATE_APP, App);
    }

    // UPDATE-based features
    if (
      isAllAppsEditable ||
      (userAppGitPermissions?.editableAppsId?.length && appId && userAppGitPermissions.editableAppsId.includes(appId))
    ) {
      can(FEATURE_KEY.GIT_UPDATE_APP, App);
      can(FEATURE_KEY.GIT_SYNC_APP, App);
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
