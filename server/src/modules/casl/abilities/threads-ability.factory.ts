import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Thread } from 'src/entities/thread.entity';
import { AbilityService } from '@services/permissions-ability.service';
import { THREAD_RESOURCE_ACTION, TOOLJET_RESOURCE } from 'src/constants/global.constant';

type Actions =
  | THREAD_RESOURCE_ACTION.CREATE
  | THREAD_RESOURCE_ACTION.DELETE
  | THREAD_RESOURCE_ACTION.READ
  | THREAD_RESOURCE_ACTION.UPDATE;

type Subjects = InferSubjects<typeof User | typeof Thread> | 'all';

export type ThreadsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class ThreadsAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async appsActions(user: User, id: string) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<ThreadsAbility>);
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
      ...(id && { resources: [{ resource: TOOLJET_RESOURCE.APP, resourceId: id }] }),
    });
    const userAppPermissions = userPermission?.App;
    const appUpdateAllowed =
      (userAppPermissions && userAppPermissions.isAllEditable) || userAppPermissions.editableAppsId.includes(id);

    if (appUpdateAllowed) {
      can(
        [
          THREAD_RESOURCE_ACTION.CREATE,
          THREAD_RESOURCE_ACTION.READ,
          THREAD_RESOURCE_ACTION.UPDATE,
          THREAD_RESOURCE_ACTION.DELETE,
        ],
        Thread
      );
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
