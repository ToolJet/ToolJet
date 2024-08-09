import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Plugin } from 'src/entities/plugin.entity';
import { AbilityService } from '@services/permissions-ability.service';
import { PLUGIN_RESOURCE_ACTION } from 'src/constants/global.constant';

type Actions = PLUGIN_RESOURCE_ACTION.INSTALL | PLUGIN_RESOURCE_ACTION.UPDATE | PLUGIN_RESOURCE_ACTION.DELETE;

type Subjects = InferSubjects<typeof User | typeof Plugin> | 'all';

export type PluginsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class PluginsAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async pluginActions(user: User) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<PluginsAbility>);

    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
    });
    const pluginPermission = userPermission.isAdmin;

    if (pluginPermission) {
      can([PLUGIN_RESOURCE_ACTION.INSTALL, PLUGIN_RESOURCE_ACTION.UPDATE, PLUGIN_RESOURCE_ACTION.DELETE], Plugin);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
