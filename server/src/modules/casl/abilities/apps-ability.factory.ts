import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { UsersService } from 'src/services/users.service';

type Actions =
  | 'authorizeOauthForSource'
  | 'cloneApp'
  | 'importApp'
  | 'createApp'
  | 'createDataSource'
  | 'createQuery'
  | 'createUsers'
  | 'createVersions'
  | 'deleteVersions'
  | 'deleteApp'
  | 'deleteDataSource'
  | 'deleteQuery'
  | 'fetchUsers'
  | 'fetchVersions'
  | 'getDataSources'
  | 'getQueries'
  | 'previewQuery'
  | 'runQuery'
  | 'updateDataSource'
  | 'updateParams'
  | 'updateQuery'
  | 'updateVersions'
  | 'updateIcon'
  | 'viewApp'
  | 'editApp';

type Subjects = InferSubjects<typeof AppVersion | typeof User | typeof App> | 'all';

export type AppsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class AppsAbilityFactory {
  constructor(private usersService: UsersService) {}

  async appsActions(user: User, id?: string) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<AppsAbility>);
    const canUpdateApp = await this.usersService.userCan(user, 'update', 'App', id);

    if (await this.usersService.userCan(user, 'create', 'User')) {
      can('createUsers', App, { organizationId: user.organizationId });
    }

    if (canUpdateApp) {
      can('editApp', App, { organizationId: user.organizationId });
    }

    if (await this.usersService.userCan(user, 'create', 'App')) {
      can('createApp', App);
      can('importApp', App);
      if (canUpdateApp) {
        can('cloneApp', App, { organizationId: user.organizationId });
      }
    }

    if (await this.usersService.userCan(user, 'read', 'App', id)) {
      can('viewApp', App, { organizationId: user.organizationId });

      can('fetchUsers', App, { organizationId: user.organizationId });
      can('fetchVersions', App, { organizationId: user.organizationId });

      can('runQuery', App, { organizationId: user.organizationId });
      can('getQueries', App, { organizationId: user.organizationId });
      can('previewQuery', App, { organizationId: user.organizationId });

      // policies for datasources
      can('getDataSources', App, { organizationId: user.organizationId });
      can('authorizeOauthForSource', App, {
        organizationId: user.organizationId,
      });
    }

    if (canUpdateApp) {
      can('updateParams', App, { organizationId: user.organizationId });
      can('createVersions', App, { organizationId: user.organizationId });
      can('deleteVersions', App, { organizationId: user.organizationId });
      can('updateVersions', App, { organizationId: user.organizationId });
      can('updateIcon', App, { organizationId: user.organizationId });

      can('updateQuery', App, { organizationId: user.organizationId });
      can('createQuery', App, { organizationId: user.organizationId });
      can('deleteQuery', App, { organizationId: user.organizationId });

      can('updateDataSource', App, { organizationId: user.organizationId });
      can('createDataSource', App, { organizationId: user.organizationId });
      can('deleteDataSource', App, { organizationId: user.organizationId });
    }

    if (await this.usersService.userCan(user, 'delete', 'App', id)) {
      can('deleteApp', App, { organizationId: user.organizationId });
    }

    can('viewApp', App, { isPublic: true });
    can('runQuery', App, { isPublic: true });

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
