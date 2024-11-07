import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Folder } from 'src/entities/folder.entity';
import { FOLDER_RESOURCE_ACTION } from 'src/constants/global.constant';
import { AbilityService } from '@services/permissions-ability.service';

type Actions = FOLDER_RESOURCE_ACTION.CREATE | FOLDER_RESOURCE_ACTION.UPDATE | FOLDER_RESOURCE_ACTION.DELETE;

type Subjects = InferSubjects<typeof User | typeof Folder> | 'all';

export type FoldersAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class FoldersAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async folderActions(user: User) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<FoldersAbility>);
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
    });
    const folderPermission = userPermission.folderCRUD;
    if (folderPermission) {
      can([FOLDER_RESOURCE_ACTION.CREATE, FOLDER_RESOURCE_ACTION.UPDATE, FOLDER_RESOURCE_ACTION.DELETE], Folder);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
