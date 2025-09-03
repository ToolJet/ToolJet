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
import { AppGitRepository } from '../repository';
import { SubModule } from '@modules/app/sub-module';

export class AppGitListenerModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    if (configs?.IS_GET_CONTEXT === true) {
      // If this module is being used to get context, we don't need to import any other modules
      // Used on migrations
      return {
        module: AppGitListenerModule,
        imports: [],
        providers: [],
      };
    }
    const {
      SourceControlProviderService,
      SSHAppGitService,
      HTTPSAppGitService,
      GitLabAppGitService,
      SSHAppGitUtilityService,
      HTTPSAppGitUtilityService,
      GitLabAppGitUtilityService,
      AppVersionRenameListener,
    } = await this.getProviders(configs, 'app-git', [
      'source-control-provider',
      'providers/github-ssh/service',
      'providers/github-https/service',
      'providers/gitlab/service',
      'providers/github-https/util.service',
      'providers/github-ssh/util.service',
      'providers/gitlab/util.service',
      'listeners/listener',
    ]);
    return {
      module: AppGitListenerModule,
      imports: [
        await AppsModule.register(configs),
        await GitSyncModule.register(configs),
        await TooljetDbModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await VersionModule.register(configs),
      ],
      providers: [
        OrganizationGitSyncRepository,
        AppGitRepository,
        AppsRepository,
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
    };
  }
}
