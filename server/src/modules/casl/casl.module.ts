import { Module } from '@nestjs/common';
import { AppsAbilityFactory } from './abilities/apps-ability.factory';
import { ThreadsAbilityFactory } from './abilities/threads-ability.factory';
import { CommentsAbilityFactory } from './abilities/comments-ability.factory';
import { PluginsAbilityFactory } from './abilities/plugins-ability.factory';
import { CaslAbilityFactory } from './casl-ability.factory';
import { FoldersAbilityFactory } from './abilities/folders-ability.factory';
import { OrgEnvironmentVariablesAbilityFactory } from './abilities/org-environment-variables-ability.factory';
import { TooljetDbAbilityFactory } from './abilities/tooljet-db-ability.factory';
import { GlobalDataSourceAbilityFactory } from './abilities/global-datasource-ability.factory';
import { OrganizationConstantsAbilityFactory } from './abilities/organization-constants-ability.factory';
import { InstanceSettingsModule } from '@instance-settings/module';

@Module({
  imports: [InstanceSettingsModule],
  providers: [
    CaslAbilityFactory,
    AppsAbilityFactory,
    ThreadsAbilityFactory,
    CommentsAbilityFactory,
    PluginsAbilityFactory,
    FoldersAbilityFactory,
    OrgEnvironmentVariablesAbilityFactory,
    TooljetDbAbilityFactory,
    GlobalDataSourceAbilityFactory,
    OrganizationConstantsAbilityFactory,
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
    OrganizationConstantsAbilityFactory,
  ],
})
export class CaslModule {}
