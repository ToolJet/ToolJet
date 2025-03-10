import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { FeatureAbilityFactory } from './ability';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';

export class GitSyncModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { GitSyncController } = await import(`${importPath}/git-sync/controller`);
    const { GitSyncService } = await import(`${importPath}/git-sync/service`);
    const { GitSyncUtilService } = await import(`${importPath}/git-sync/util.service`);

    return {
      module: GitSyncModule,
      imports: [],
      providers: [GitSyncService, GitSyncUtilService, OrganizationGitSyncRepository, FeatureAbilityFactory],
      controllers: [GitSyncController],
      exports: [GitSyncUtilService],
    };
  }
}
