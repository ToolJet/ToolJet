import { DynamicModule } from '@nestjs/common';
import { AppsRepository } from '@modules/apps/repository';
import { VersionRepository } from '@modules/versions/repository';
import { GitSyncModule } from '@modules/git-sync/module';
import { AppsModule } from '@modules/apps/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { VersionModule } from '@modules/versions/module';
import { FeatureAbilityFactory } from '@modules/app-git/ability/index';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { AppGitRepository } from './repository';
import { SubModule } from '@modules/app/sub-module';
export class AppGitModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const {
      AppGitController,
      AppGitService,
      SourceControlProviderService,
      SSHAppGitService,
      HTTPSAppGitService,
      GitLabAppGitService,
      SSHAppGitUtilityService,
      HTTPSAppGitUtilityService,
      GitLabAppGitUtilityService,
      AppVersionRenameListener,
    } = await this.getProviders(configs, 'app-git', [
      'controller',
      'service',
      'source-control-provider',
      'providers/github-ssh/service',
      'providers/github-https/service',
      'providers/gitlab/service',
      'providers/github-https/util.service',
      'providers/github-ssh/util.service',
      'providers/gitlab/util.service',
      'listener',
    ]);
    return {
      module: AppGitModule,
      imports: [
        await AppsModule.register(configs),
        await GitSyncModule.register(configs),
        await TooljetDbModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await VersionModule.register(configs),
      ],
      controllers: [AppGitController],
      providers: [
        OrganizationGitSyncRepository,
        AppGitRepository,
        AppsRepository,
        AppGitService,
        SourceControlProviderService,
        SSHAppGitService,
        HTTPSAppGitService,
        GitLabAppGitService,
        SSHAppGitUtilityService,
        HTTPSAppGitUtilityService,
        GitLabAppGitUtilityService,
        VersionRepository,
        FeatureAbilityFactory,
        AppVersionRenameListener,
      ],
      exports: [SSHAppGitUtilityService, HTTPSAppGitUtilityService, GitLabAppGitUtilityService],
    };
  }
}
