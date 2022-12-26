import { User } from 'src/entities/user.entity';
import { AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/services/users.service';

export enum Action {
  ProxyPostgrest = 'proxyPostgrest',
  ViewTables = 'viewTables',
  ViewTable = 'viewTable',
  CreateTable = 'createTable',
  DropTable = 'dropTable',
  AddColumn = 'addColumn',
  DropColumn = 'dropColumn',
}

type Subjects = 'all';

export type TooljetDbAbility = Ability<[Action, Subjects]>;

@Injectable()
export class TooljetDbAbilityFactory {
  constructor(private usersService: UsersService) {}

  async actions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Action, Subjects]>>(Ability as AbilityClass<TooljetDbAbility>);
    const isAdmin = await this.usersService.hasGroup(user, 'admin', params.oraganizationId);

    if (isAdmin) {
      can(Action.CreateTable, 'all');
      can(Action.DropTable, 'all');
      can(Action.AddColumn, 'all');
      can(Action.DropColumn, 'all');
    }
    can(Action.ProxyPostgrest, 'all');
    can(Action.ViewTables, 'all');
    can(Action.ViewTable, 'all');

    return build({
      detectSubjectType: (item) => item as ExtractSubjectType<Subjects>,
    });
  }
}
