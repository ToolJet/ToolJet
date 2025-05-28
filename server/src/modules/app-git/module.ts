import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { AppsRepository } from '@modules/apps/repository';
import { VersionRepository } from '@modules/versions/repository';
import { GitSyncModule } from '@modules/git-sync/module';
import { AppsModule } from '@modules/apps/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { VersionModule } from '@modules/versions/module';
import { AppsAbilityFactory } from '@modules/casl/abilities/apps-ability.factory';
import { AppGitAbilityFactory } from '@modules/app-git/ability/index';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { AppGitRepository } from './repository';
export class AppGitModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { AppGitController } = await import(`${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/controller`);
    const { AppGitService } = await import(`${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/service`);
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
    const { HTTPSAppGitUtilityService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/providers/github-https/util.service`
    );
    const { SSHAppGitUtilityService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/providers/github-ssh/util.service`
    );
    const { GitLabAppGitUtilityService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/app-git/providers/gitlab/util.service`
    );
    const { BaseGitUtilService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/base-git-util.service`
    );
    const { BaseGitSyncService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/base-git.service`
    );
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
        AppsAbilityFactory,
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
      ],
      exports: [SSHAppGitUtilityService, HTTPSAppGitUtilityService, GitLabAppGitUtilityService],
    };
  }
}
