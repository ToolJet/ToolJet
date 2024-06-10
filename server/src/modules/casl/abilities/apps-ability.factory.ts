import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { UsersService } from 'src/services/users.service';
import { AbilityService } from '@services/permissions-ability.service';
import { APP_RESOURCE_ACTIONS, TOOLJET_RESOURCE } from 'src/constants/global.constant';

type Actions =
  | 'authorizeOauthForSource' //Deprecated
  | APP_RESOURCE_ACTIONS.CLONE //
  | APP_RESOURCE_ACTIONS.IMPORT //
  | APP_RESOURCE_ACTIONS.CREATE //
  | 'createDataSource' //
  | 'createQuery' //
  | 'createUsers' //
  | 'createVersions' //
  | 'deleteVersions' //
  | 'deleteApp' //
  | 'deleteDataSource' //
  | 'deleteQuery' //
  | 'fetchUsers' //
  | 'fetchVersions' //
  | 'getDataSources'
  | 'getQueries'
  | 'previewQuery'
  | 'runQuery'
  | 'updateDataSource'
  | 'updateParams'
  | 'updateQuery'
  | 'updateVersions'
  | 'updateIcon'
  | APP_RESOURCE_ACTIONS.VIEW
  | APP_RESOURCE_ACTIONS.EDIT
  | APP_RESOURCE_ACTIONS.EXPORT;

type Subjects = InferSubjects<typeof AppVersion | typeof User | typeof App> | 'all';

export type AppsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class AppsAbilityFactory {
  constructor(private usersService: UsersService, private abilityService: AbilityService) {}

  async appsActions(user: User, id?: string) {
    const { can, build } = new AbilityBuilder<Ability<[Actions | APP_RESOURCE_ACTIONS, Subjects]>>(
      Ability as AbilityClass<AppsAbility>
    );

    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
      ...(id && { resources: [{ resource: TOOLJET_RESOURCE.APP, resourceId: id }] }),
    });
    const userAppPermissions = userPermission?.App;
    const appUpdateAllowed =
      (userAppPermissions && userAppPermissions.isAllEditable) || userAppPermissions.editableAppsId.includes(id);
    const appViewAllowed =
      userAppPermissions &&
      (appUpdateAllowed || userAppPermissions.isAllViewable || userAppPermissions.viewableAppsId.includes(id));

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
      if (appUpdateAllowed) {
        can(APP_RESOURCE_ACTIONS.EXPORT, App);
        can(APP_RESOURCE_ACTIONS.CLONE, App);
      }
    }

    if (appViewAllowed) {
      can(APP_RESOURCE_ACTIONS.VIEW, App);

      //Delete this actions
      can('fetchUsers', App);
      can('fetchVersions', App);

      can('runQuery', App);
      can('getQueries', App);
      can('previewQuery', App);

      // policies for data sources
      can('getDataSources', App);
      can('authorizeOauthForSource', App);
    }

    if (appUpdateAllowed) {
      can('updateParams', App);
      can('createVersions', App);
      can('deleteVersions', App);
      can('updateVersions', App);
      can('updateIcon', App);

      can('updateQuery', App);
      can('createQuery', App);
      can('deleteQuery', App);

      //TODO: Need to remove this after depreciating local data source
      can('updateDataSource', App);
      can('createDataSource', App);
      can('deleteDataSource', App);
    }

    if (userPermission.appDelete) {
      can('deleteApp', App);
    }

    can(APP_RESOURCE_ACTIONS.VIEW, App, { isPublic: true });
    can('runQuery', App, { isPublic: true });

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
