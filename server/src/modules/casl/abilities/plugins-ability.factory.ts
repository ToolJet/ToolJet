import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/services/users.service';
import { Plugin } from 'src/entities/plugin.entity';

type Actions = 'installPlugin' | 'updatePlugin' | 'deletePlugin';

type Subjects = InferSubjects<typeof User | typeof Plugin> | 'all';

export type PluginsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class PluginsAbilityFactory {
  constructor(private usersService: UsersService) {}

  async pluginActions(user: User) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<PluginsAbility>);

    if (await this.usersService.userCan(user, 'create', 'Plugin')) {
      can('installPlugin', Plugin);
    }

    if (await this.usersService.userCan(user, 'update', 'Plugin')) {
      can('updatePlugin', Plugin);
    }

    if (await this.usersService.userCan(user, 'delete', 'Plugin')) {
      can('deletePlugin', Plugin);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
