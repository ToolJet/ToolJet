import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { OrganizationUsersService } from '@services/organization_users.service';
import { App } from 'src/entities/app.entity';

type Actions = 'updateParams' | 'fetchUsers' | 'createUsers' | 'fetchVersions';

type Subjects = InferSubjects<typeof OrganizationUser| typeof User | typeof App> | 'all';

export type AppsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class AppsAbilityFactory {

  async appsActions(user: User, params: any) {
    const { can, cannot, build } = new AbilityBuilder<  
      Ability<[Actions, Subjects]>
    >(Ability as AbilityClass<AppsAbility>);

    // Only admins can update app params such as name, friendly url & visibility
    if(user.isAdmin) {
      can('updateParams', App, { organizationId: user.organizationId } );
      can('createUsers', App, { organizationId: user.organizationId } );
    }

    // All organization users can view the app users
    can('fetchUsers', App, { organizationId: user.organizationId });
    can('fetchVersions', App, { organizationId: user.organizationId });

    return build({
      detectSubjectType: item => item.constructor as ExtractSubjectType<Subjects>
    });
  }
}
