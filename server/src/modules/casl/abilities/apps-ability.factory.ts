import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AbilityService } from '@services/permissions-ability.service';
import { APP_RESOURCE_ACTIONS, TOOLJET_RESOURCE } from 'src/constants/global.constant';

type Actions =
  | 'authorizeOauthForSource' //Deprecated
  | APP_RESOURCE_ACTIONS.CLONE
  | APP_RESOURCE_ACTIONS.IMPORT
  | APP_RESOURCE_ACTIONS.CREATE
  | 'createDataSource'
  | 'createQuery'
  | 'createUsers'
  | APP_RESOURCE_ACTIONS.VERSIONS_CREATE
  | APP_RESOURCE_ACTIONS.VERSION_DELETE
  | 'deleteApp'
  | 'deleteDataSource'
  | 'deleteQuery'
  | 'fetchUsers'
  | APP_RESOURCE_ACTIONS.VERSION_READ
  | 'getDataSources'
  | 'getQueries'
  | 'previewQuery'
  | 'runQuery'
  | 'updateDataSource'
  | APP_RESOURCE_ACTIONS.UPDATE
  | 'updateQuery'
  | APP_RESOURCE_ACTIONS.VERSION_UPDATE
  | APP_RESOURCE_ACTIONS.UPDATE
  | APP_RESOURCE_ACTIONS.VIEW
  | APP_RESOURCE_ACTIONS.EDIT
  | APP_RESOURCE_ACTIONS.EXPORT;

type Subjects = InferSubjects<typeof AppVersion | typeof User | typeof App> | 'all';

export type AppsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class AppsAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async appsActions(user: User, id?: string) {
    const { can, build } = new AbilityBuilder<Ability<[Actions | APP_RESOURCE_ACTIONS, Subjects]>>(
      Ability as AbilityClass<AppsAbility>
    );

    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
      ...(id && { resources: [{ resource: TOOLJET_RESOURCE.APP, resourceId: id }] }),
    });
    const userAppPermissions = userPermission?.App;
    const appUpdateAllowed = userAppPermissions
      ? userAppPermissions.isAllEditable || userAppPermissions.editableAppsId.includes(id)
      : false;
    const appViewAllowed = userAppPermissions
      ? appUpdateAllowed || userAppPermissions.isAllViewable || userAppPermissions.viewableAppsId.includes(id)
      : false;

    //For app users.
    if (userPermission.appCreate) {
      can('createUsers', App);
    }

    if (appUpdateAllowed) {
      can(APP_RESOURCE_ACTIONS.EDIT, App);
    }

    if (userPermission.appCreate) {
      can(APP_RESOURCE_ACTIONS.CREATE, App);
      can(APP_RESOURCE_ACTIONS.IMPORT, App);
      can(APP_RESOURCE_ACTIONS.EXPORT, App);
      if (appUpdateAllowed) {
        can(APP_RESOURCE_ACTIONS.CLONE, App);
      }
    }

    if (appViewAllowed) {
      can(APP_RESOURCE_ACTIONS.VIEW, App);

      //Delete this actions
      can('fetchUsers', App);
      can(APP_RESOURCE_ACTIONS.VERSION_READ, App);

      can('runQuery', App);
      can('getQueries', App);
      can('previewQuery', App);

      // policies for data sources
      can('getDataSources', App);
      can('authorizeOauthForSource', App);
    }

    if (appUpdateAllowed) {
      can(APP_RESOURCE_ACTIONS.UPDATE, App);
      can(APP_RESOURCE_ACTIONS.VERSIONS_CREATE, App);
      can(APP_RESOURCE_ACTIONS.VERSION_DELETE, App);
      can(APP_RESOURCE_ACTIONS.VERSION_UPDATE, App);
      can(APP_RESOURCE_ACTIONS.UPDATE, App);

      can('updateQuery', App);
      can('createQuery', App);
      can('deleteQuery', App);

      //TODO: Need to remove this after depreciating local data source
      can('updateDataSource', App);
      can('createDataSource', App);
      can('deleteDataSource', App);
    }

    if (userPermission.appDelete) {
      can(APP_RESOURCE_ACTIONS.DELETE, App);
    }

    can(APP_RESOURCE_ACTIONS.VIEW, App, { isPublic: true });
    can('runQuery', App, { isPublic: true });

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
