import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Comment } from 'src/entities/comment.entity';
import { COMMENT_RESOURCE_ACTION, TOOLJET_RESOURCE } from 'src/constants/global.constant';
import { AbilityService } from '@services/permissions-ability.service';

type Actions =
  | COMMENT_RESOURCE_ACTION.CREATE
  | COMMENT_RESOURCE_ACTION.DELETE
  | COMMENT_RESOURCE_ACTION.READ
  | COMMENT_RESOURCE_ACTION.UPDATE;

type Subjects = InferSubjects<typeof User | typeof Comment> | 'all';

export type CommentsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CommentsAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async appsActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<CommentsAbility>);
    const { id } = params;

    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
      ...(id && { resources: [{ resource: TOOLJET_RESOURCE.APP, resourceId: id }] }),
    });
    const userAppPermissions = userPermission?.App;
    const appUpdateAllowed = userAppPermissions
      ? userAppPermissions.isAllEditable || userAppPermissions.editableAppsId.includes(id)
      : false;

    if (appUpdateAllowed) {
      can(COMMENT_RESOURCE_ACTION.CREATE, Comment, { organizationId: user.organizationId });
    }

    if (appUpdateAllowed) {
      can(COMMENT_RESOURCE_ACTION.READ, Comment, { organizationId: user.organizationId });
    }

    if (appUpdateAllowed) {
      can(COMMENT_RESOURCE_ACTION.UPDATE, Comment, { organizationId: user.organizationId });
    }

    if (appUpdateAllowed) {
      can(COMMENT_RESOURCE_ACTION.DELETE, Comment, { organizationId: user.organizationId });
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
