import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { OrganizationUsersService } from '@services/organization_users.service';
import { App } from 'src/entities/app.entity';

type Actions = 'changeRole' | 'archiveUser' | 'inviteUser' | 'updateParams' | 'makePublic';

type Subjects = InferSubjects<typeof OrganizationUser| typeof User | typeof App> | 'all';

export type AppsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class AppsAbilityFactory {

  async appsActions(user: User, params: any) {
    const { can, cannot, build } = new AbilityBuilder<  
      Ability<[Actions, Subjects]>
    >(Ability as AbilityClass<AppsAbility>);

    if(user.isAdmin) {
      can('updateParams', App, { organizationId: user.organizationId } );
    }

    return build({
      detectSubjectType: item => item.constructor as ExtractSubjectType<Subjects>
    });
  }
}
