import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/services/users.service';
import { CustomStyles } from 'src/entities/custom_styles.entity';

type Actions = 'saveCustomStyles';

type Subjects = InferSubjects<typeof User | typeof CustomStyles> | 'all';

export type CustomStylesAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CustomStylesAbilityFactory {
  constructor(private usersService: UsersService) {}

  async customStylesActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(
      Ability as AbilityClass<CustomStylesAbility>
    );

    if (await this.usersService.userCan(user, null, 'CustomStyle', null)) {
      can('saveCustomStyles', CustomStyles);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
