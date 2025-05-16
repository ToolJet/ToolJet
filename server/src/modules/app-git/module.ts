import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { AppGitSync } from '@entities/app_git_sync.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationGitSsh } from '@entities/gitsync_entities/organization_git_ssh.entity';
import { AppsRepository } from '@modules/apps/repository';
import { VersionRepository } from '@modules/versions/repository';
import { GitSyncModule } from '@modules/git-sync/module';
import { AppsModule } from '@modules/apps/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { VersionModule } from '@modules/versions/module';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { AppsAbilityFactory } from '@modules/casl/abilities/apps-ability.factory';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { AppVersion } from '@entities/app_version.entity';
import { AppGitAbilityFactory } from '@modules/app-git/ability/index';
export class AppGitModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { AppGitController } = await import(`${await getImportPath()}/app-git/controller`);
    const { AppGitService } = await import(`${await getImportPath()}/app-git/service`);
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
      module: AppGitModule,
      imports: [
        TypeOrmModule.forFeature([
          AppGitSync,
          VersionRepository,
          OrganizationGitSsh,
          OrganizationGitSync,
          OrganizationGitHttps,
          AppsRepository,
          AppVersion,
        ]),
        await AppsModule.register(configs),
        await GitSyncModule.register(configs),
        await TooljetDbModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await VersionModule.register(configs),
      ],
      controllers: [AppGitController],
      providers: [
        AppGitService,
        AppsAbilityFactory,
        SourceControlProviderService,
        SSHGitSyncService,
        HTTPSGitSyncService,
        SSHGitSyncUtilityService,
        HTTPSGitSyncUtilityService,
        VersionRepository,
        BaseGitUtilService,
        BaseGitSyncService,
        AppGitAbilityFactory,
      ],
      exports: [SSHGitSyncUtilityService, HTTPSGitSyncUtilityService],
    };
  }
}
