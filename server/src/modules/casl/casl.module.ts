import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from '@services/email.service';
import { OrganizationUsersService } from '@services/organization_users.service';
import { UsersService } from '@services/users.service';
import { App } from 'src/entities/app.entity';
import { File } from 'src/entities/file.entity';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import { AppsAbilityFactory } from './abilities/apps-ability.factory';
import { ThreadsAbilityFactory } from './abilities/threads-ability.factory';
import { CommentsAbilityFactory } from './abilities/comments-ability.factory';
import { PluginsAbilityFactory } from './abilities/plugins-ability.factory';
import { CaslAbilityFactory } from './casl-ability.factory';
import { FoldersAbilityFactory } from './abilities/folders-ability.factory';
import { FilesService } from '@services/files.service';
import { OrgEnvironmentVariablesAbilityFactory } from './abilities/org-environment-variables-ability.factory';
import { TooljetDbAbilityFactory } from './abilities/tooljet-db-ability.factory';
import { GlobalDataSourceAbilityFactory } from './abilities/global-datasource-ability.factory';

@Module({
  imports: [TypeOrmModule.forFeature([User, File, Organization, OrganizationUser, App])],
  providers: [
    CaslAbilityFactory,
    OrganizationUsersService,
    FilesService,
    UsersService,
    EmailService,
    AppsAbilityFactory,
    ThreadsAbilityFactory,
    CommentsAbilityFactory,
    PluginsAbilityFactory,
    FoldersAbilityFactory,
    OrgEnvironmentVariablesAbilityFactory,
    TooljetDbAbilityFactory,
    GlobalDataSourceAbilityFactory,
  ],
  exports: [
    CaslAbilityFactory,
    AppsAbilityFactory,
    ThreadsAbilityFactory,
    CommentsAbilityFactory,
    PluginsAbilityFactory,
    FoldersAbilityFactory,
    OrgEnvironmentVariablesAbilityFactory,
    TooljetDbAbilityFactory,
    GlobalDataSourceAbilityFactory,
  ],
})
export class CaslModule {}
