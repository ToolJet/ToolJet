import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/services/users.service';
import { DataSource } from 'src/entities/data_source.entity';

type Actions =
  | 'readGlobalDataSource'
  | 'createGlobalDataSource'
  | 'updateGlobalDataSource'
  | 'deleteGlobalDataSource'
  | 'authorizeOauthForSource'
  | 'fetchEnvironments';

type Subjects = InferSubjects<typeof User | typeof DataSource> | 'all';

export type GlobalDataSourcesAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class GlobalDataSourceAbilityFactory {
  constructor(private usersService: UsersService) {}

  async globalDataSourceActions(user: User, dataSourceId?: string) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(
      Ability as AbilityClass<GlobalDataSourcesAbility>
    );

    if (await this.usersService.userCan(user, 'read', 'GlobalDataSource', dataSourceId)) {
      can('fetchEnvironments', DataSource);
      can('readGlobalDataSource', DataSource);
    }

    if (await this.usersService.userCan(user, 'create', 'GlobalDataSource')) {
      can('createGlobalDataSource', DataSource);
      can('updateGlobalDataSource', DataSource);
      can('fetchEnvironments', DataSource);
    }

    if (await this.usersService.userCan(user, 'update', 'GlobalDataSource', dataSourceId)) {
      can('updateGlobalDataSource', DataSource);
      can('fetchEnvironments', DataSource);
    }

    if (await this.usersService.userCan(user, 'delete', 'GlobalDataSource')) {
      can('deleteGlobalDataSource', DataSource);
      can('fetchEnvironments', DataSource);
    }

    if (await this.usersService.userCan(user, 'create', 'GlobalDataSource')) {
      can('authorizeOauthForSource', DataSource);
      can('fetchEnvironments', DataSource);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
