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
export class AppGitModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { AppGitController } = await import(`${await getImportPath()}/app-git/controller`);
    const { AppGitService } = await import(`${await getImportPath()}/app-git/service`);
    const { AppGitUtilService } = await import(`${await getImportPath()}/app-git/util.service`);

    return {
      module: AppGitModule,
      imports: [
        TypeOrmModule.forFeature([
          AppGitSync,
          VersionRepository,
          OrganizationGitSsh,
          OrganizationGitHttps,
          AppsRepository,
          VersionRepository,
        ]),
        await AppsModule.register(configs),
        await GitSyncModule.register(configs),
        await TooljetDbModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await VersionModule.register(configs),
      ],
      controllers: [AppGitController],
      providers: [AppGitService, AppGitUtilService, AppsRepository, VersionRepository],
      exports: [AppGitUtilService],
    };
  }
}
