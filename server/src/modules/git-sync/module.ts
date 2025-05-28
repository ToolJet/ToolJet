import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { AppsModule } from '@modules/apps/module';
import { VersionModule } from '@modules/versions/module';
import { OrganizationGitSyncRepository } from './repository';
import { VersionRepository } from '@modules/versions/repository';
import { AppVersion } from '@entities/app_version.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

export class GitSyncModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { GitSyncController } = await import(`${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/controller`);
    const { GitSyncService } = await import(`${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/service`);
    const { SourceControlProviderService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/source-control-provider`
    );
    const { SSHGitSyncService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/providers/github-ssh/service`
    );
    const { HTTPSGitSyncService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/providers/github-https/service`
    );
    const { GitLabGitSyncService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/providers/gitlab/service`
    );
    const { HTTPSGitSyncUtilityService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/providers/github-https/util.service`
    );
    const { SSHGitSyncUtilityService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/providers/github-ssh/util.service`
    );
    const { GitLabGitSyncUtilityService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/providers/gitlab/util.service`
    );
    const { BaseGitUtilService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/base-git-util.service`
    );
    const { BaseGitSyncService } = await import(
      `${await getImportPath(configs?.IS_GET_CONTEXT)}/git-sync/base-git.service`
    );
    return {
      module: GitSyncModule,
      imports: [
        TypeOrmModule.forFeature([AppVersion]),
        await ImportExportResourcesModule.register(configs),
        await TooljetDbModule.register(configs),
        await AppsModule.register(configs),
        await VersionModule.register(configs),
      ],
      controllers: [GitSyncController],
      providers: [
        OrganizationGitSyncRepository,
        VersionRepository,
        BaseGitUtilService,
        BaseGitSyncService,
        GitSyncService,
        SourceControlProviderService,
        SSHGitSyncService,
        HTTPSGitSyncService,
        GitLabGitSyncService,
        HTTPSGitSyncUtilityService,
        SSHGitSyncUtilityService,
        GitLabGitSyncUtilityService,
      ],
      exports: [HTTPSGitSyncUtilityService, SSHGitSyncUtilityService, GitLabGitSyncUtilityService],
    };
  }
}
