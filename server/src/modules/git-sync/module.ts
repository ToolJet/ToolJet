import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '@entities/organization.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { OrganizationGitSsh } from '@entities/gitsync_entities/organization_git_ssh.entity';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { AppVersion } from '@entities/app_version.entity';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { AppsModule } from '@modules/apps/module';
import { VersionModule } from '@modules/versions/module';
import { AppGitSync } from '@entities/app_git_sync.entity';

export class GitSyncModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { GitSyncController } = await import(`${await getImportPath()}/git-sync/controller`);
    const { GitSyncService } = await import(`${await getImportPath()}/git-sync/service`);
    const { GitSyncUtilService } = await import(`${await getImportPath()}/git-sync/util.service`);
    const { SourceControlProviderService } = await import(`${await getImportPath()}/git-sync/source-control-provider`);
    const { SSHGitSyncService } = await import(`${await getImportPath()}/git-sync/providers/github-ssh/service`);
    const { HTTPSGitSyncService } = await import(`${await getImportPath()}/git-sync/providers/github-https/service`);
    const { HTTPSGitSyncUtilityService } = await import(
      `${await getImportPath()}/git-sync/providers/github-https/util.service`
    );
    const { SSHGitSyncUtilityService } = await import(
      `${await getImportPath()}/git-sync/providers/github-ssh/util.service`
    );
    const { BaseGitUtilService } = await import(`${await getImportPath()}/git-sync/base-git-util.service`);
    const { BaseGitSyncService } = await import(`${await getImportPath()}/git-sync/base-git.service`);

    return {
      module: GitSyncModule,
      imports: [
        TypeOrmModule.forFeature([
          AppGitSync,
          OrganizationGitSync,
          Organization,
          OrganizationGitSsh,
          OrganizationGitHttps,
          AppVersion,
        ]),
        await ImportExportResourcesModule.register(configs),
        await TooljetDbModule.register(configs),
        await AppsModule.register(configs),
        await VersionModule.register(configs),
      ],
      controllers: [GitSyncController],
      providers: [
        GitSyncService,
        GitSyncUtilService,
        SourceControlProviderService,
        SSHGitSyncService,
        HTTPSGitSyncService,
        HTTPSGitSyncUtilityService,
        SSHGitSyncUtilityService,
        BaseGitUtilService,
        BaseGitSyncService,
      ],
      exports: [GitSyncUtilService],
    };
  }
}
