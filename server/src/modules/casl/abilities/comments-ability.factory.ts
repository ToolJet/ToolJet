import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Comment } from 'src/entities/comment.entity';
import { UsersService } from 'src/services/users.service';

type Actions = 'createComment' | 'deleteComment' | 'fetchComments' | 'updateComment';

type Subjects = InferSubjects<typeof User | typeof Comment> | 'all';

export type CommentsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CommentsAbilityFactory {
  constructor(private usersService: UsersService) {}

  async appsActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<CommentsAbility>);

    if (await this.usersService.userCan(user, 'create', 'Comment', params.id)) {
      can('createComment', Comment, { organizationId: user.organizationId });
    }

    if (await this.usersService.userCan(user, 'read', 'Comment', params.id)) {
      can('fetchComments', Comment, { organizationId: user.organizationId });
    }

    if (await this.usersService.userCan(user, 'update', 'Comment', params.id)) {
      can('updateComment', Comment, { organizationId: user.organizationId });
    }

    if (await this.usersService.userCan(user, 'delete', 'Comment', params.id)) {
      can('deleteComment', Comment, { organizationId: user.organizationId });
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
