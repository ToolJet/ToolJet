import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { AppGitSync } from '@entities/app_git_sync.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

export class AppGitModule {
  static async register(): Promise<DynamicModule> {
    const { AppGitController } = await import(`${await getImportPath()}/app-git/controller`);
    const { AppGitService } = await import(`${await getImportPath()}/app-git/service`);
    const { AppGitUtilService } = await import(`${await getImportPath()}/app-git/util.service`);
    const { GitSyncUtilService } = await import(`${await getImportPath()}/git-sync/util.service`);
    const { AppsRepository } = await import(`${await getImportPath()}/apps/repository`);
    const { VersionRepository } = await import(`${await getImportPath()}/versions/repository`);

    //Register the module

    return {
      module: AppGitModule,
      imports: [TypeOrmModule.forFeature([AppGitSync])],
      controllers: [AppGitController],
      providers: [AppGitService, AppGitUtilService, GitSyncUtilService, AppsRepository, VersionRepository],
      exports: [AppGitUtilService],
    };
  }
}
