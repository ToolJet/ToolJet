import { DynamicModule } from '@nestjs/common';
import { AppGitModule } from '@modules/app-git/module';
import { getImportPath } from '@modules/app/constants';
import { GitSyncModule } from '@modules/git-sync/module';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { VersionModule } from '@modules/versions/module';
import { AppsModule } from '@modules/apps/module';
import { AppGitRepository } from '@modules/app-git/repository';
import { AppsRepository } from '@modules/apps/repository';
import { AppGitAbilityFactory } from '@modules/app-git/ability';
import { AppGitService } from '@modules/app-git/service';
import { BaseGitSyncService } from '@modules/git-sync/base-git.service';
import { VersionRepository } from '@modules/versions/repository';

export class AppVersionRenameModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { AppVersionRenameListener } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-version-rename/listener`
    );
    const { SourceControlProviderService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/source-control-provider`
    );
    const { SSHAppGitService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/providers/github-ssh/service`
    );
    const { HTTPSAppGitService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/providers/github-https/service`
    );
    const { GitLabAppGitService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/providers/gitlab/service`
    );
    const { BaseGitUtilService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/base-git-util.service`
    );
    const { HTTPSAppGitUtilityService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/providers/github-https/util.service`
    );
    const { SSHAppGitUtilityService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/providers/github-ssh/util.service`
    );
    const { GitLabAppGitUtilityService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/providers/gitlab/util.service`
    );
    return {
      module: AppVersionRenameModule,
      imports: [
        await AppGitModule.register(configs),
        await GitSyncModule.register(configs),
        await TooljetDbModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await VersionModule.register(configs),
        await AppsModule.register(configs),
      ],
      controllers: [],
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
        BaseGitUtilService,
        BaseGitSyncService,
        AppGitAbilityFactory,
        AppVersionRenameListener,
      ],
    };
  }
}
