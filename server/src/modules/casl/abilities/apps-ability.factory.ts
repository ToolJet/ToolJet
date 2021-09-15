import { User } from 'src/entities/user.entity';
import {
  InferSubjects,
  AbilityBuilder,
  Ability,
  AbilityClass,
  ExtractSubjectType,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';

type Actions =
  | 'authorizeOauthForSource'
  | 'createApp'
  | 'createDataSource'
  | 'createQuery'
  | 'createUsers'
  | 'createVersions'
  | 'deleteApp'
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
  | 'viewApp';

type Subjects =
  | InferSubjects<typeof AppVersion | typeof User | typeof App>
  | 'all';

export type AppsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class AppsAbilityFactory {
  async appsActions(user: User, params: any) {
    const { can, cannot, build } = new AbilityBuilder<
      Ability<[Actions, Subjects]>
    >(Ability as AbilityClass<AppsAbility>);

    // Only admins can update app params such as name, friendly url & visibility
    if (user.isAdmin) {
      can('updateParams', App, { organizationId: user.organizationId });
      can('createUsers', App, { organizationId: user.organizationId });
      can('deleteApp', App, { organizationId: user.organizationId });
    }

    // Only developers and admins can create new versions
    if (user.isAdmin || user.isDeveloper) {
      can('createApp', App);

      can('createVersions', App, { organizationId: user.organizationId });
      can('updateVersions', App, { organizationId: user.organizationId });

      can('updateQuery', App, { organizationId: user.organizationId });
      can('createQuery', App, { organizationId: user.organizationId });
      can('deleteQuery', App, { organizationId: user.organizationId });

      can('updateDataSource', App, { organizationId: user.organizationId });
      can('createDataSource', App, { organizationId: user.organizationId });
    }

    // All organization users can view the app users
    can('fetchUsers', App, { organizationId: user.organizationId });
    can('fetchVersions', App, { organizationId: user.organizationId });

    // Can view public apps
    can('viewApp', App, { isPublic: true });
    can('viewApp', App, { organizationId: user.organizationId });

    // if app belongs to org, queries can be run
    can('runQuery', App, { organizationId: user.organizationId });
    can('getQueries', App, { organizationId: user.organizationId });
    can('previewQuery', App, { organizationId: user.organizationId });

    // policies for datasources
    can('getDataSources', App, { organizationId: user.organizationId });
    can('authorizeOauthForSource', App, {
      organizationId: user.organizationId,
    });

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
