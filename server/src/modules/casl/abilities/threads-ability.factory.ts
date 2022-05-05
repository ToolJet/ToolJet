import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Thread } from 'src/entities/thread.entity';
import { UsersService } from 'src/services/users.service';

type Actions = 'createThread' | 'deleteThread' | 'fetchThreads' | 'updateThread';

type Subjects = InferSubjects<typeof User | typeof Thread> | 'all';

export type ThreadsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class ThreadsAbilityFactory {
  constructor(private usersService: UsersService) {}

  async appsActions(user: User, id: string) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<ThreadsAbility>);

    if (await this.usersService.userCan(user, 'create', 'Thread', id)) {
      can('createThread', Thread, { organizationId: user.organizationId });
    }

    if (await this.usersService.userCan(user, 'read', 'Thread', id)) {
      can('fetchThreads', Thread, { organizationId: user.organizationId });
    }

    if (await this.usersService.userCan(user, 'update', 'Thread', id)) {
      can('updateThread', Thread, { organizationId: user.organizationId });
    }

    if (await this.usersService.userCan(user, 'delete', 'Thread', id)) {
      can('deleteThread', Thread, { organizationId: user.organizationId });
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
