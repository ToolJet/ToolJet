import { DynamicModule } from '@nestjs/common';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { AppsModule } from '@modules/apps/module';
import { VersionModule } from '@modules/versions/module';
import { OrganizationGitSyncRepository } from './repository';
import { VersionRepository } from '@modules/versions/repository';
import { AppGitRepository } from '@modules/app-git/repository';
import { SubModule } from '@modules/app/sub-module';
import { FeatureAbilityFactory } from './ability';

export class GitSyncModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const {
      GitSyncController,
      GitSyncService,
      SourceControlProviderService,
      SSHGitSyncService,
      HTTPSGitSyncService,
      GitLabGitSyncService,
      HTTPSGitSyncUtilityService,
      SSHGitSyncUtilityService,
      GitLabGitSyncUtilityService,
      BaseGitUtilService,
      BaseGitSyncService,
    } = await this.getProviders(configs, 'git-sync', [
      'controller',
      'service',
      'source-control-provider',
      'providers/github-ssh/service',
      'providers/github-https/service',
      'providers/gitlab/service',
      'providers/github-https/util.service',
      'providers/github-ssh/util.service',
      'providers/gitlab/util.service',
      'base-git-util.service',
      'base-git.service',
    ]);

    return {
      module: GitSyncModule,
      imports: [
        await ImportExportResourcesModule.register(configs),
        await TooljetDbModule.register(configs),
        await AppsModule.register(configs),
        await VersionModule.register(configs),
      ],
      controllers: [GitSyncController],
      providers: [
        OrganizationGitSyncRepository,
        VersionRepository,
        AppGitRepository,
        BaseGitUtilService,
        BaseGitSyncService,
        GitSyncService,
        SSHGitSyncService,
        HTTPSGitSyncService,
        GitLabGitSyncService,
        HTTPSGitSyncUtilityService,
        SSHGitSyncUtilityService,
        GitLabGitSyncUtilityService,
        SourceControlProviderService,
        FeatureAbilityFactory,
      ],
      exports: [
        HTTPSGitSyncUtilityService,
        SSHGitSyncUtilityService,
        GitLabGitSyncUtilityService,
        BaseGitSyncService,
        BaseGitUtilService,
      ],
    };
  }
}
