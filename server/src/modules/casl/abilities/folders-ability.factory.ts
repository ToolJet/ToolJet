import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/services/users.service';
import { Folder } from 'src/entities/folder.entity';

type Actions = 'createFolder' | 'updateFolder' | 'deleteFolder';

type Subjects = InferSubjects<typeof User | typeof Folder> | 'all';

export type FoldersAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class FoldersAbilityFactory {
  constructor(private usersService: UsersService) {}

  async folderActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<FoldersAbility>);

    if (await this.usersService.userCan(user, 'create', 'Folder')) {
      can('createFolder', Folder);
    }

    if (await this.usersService.userCan(user, 'update', 'Folder')) {
      can('updateFolder', Folder);
    }

    if (await this.usersService.userCan(user, 'delete', 'Folder')) {
      can('deleteFolder', Folder);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
