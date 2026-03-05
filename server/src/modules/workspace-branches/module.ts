import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { DynamicModule } from '@nestjs/common';
import { GitSyncModule } from '@modules/git-sync/module';
import { AppGitModule } from '@modules/app-git/module';

export class WorkspaceBranchesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { WorkspaceBranchController, WorkspaceBranchService } = await this.getProviders(
      configs,
      'workspace-branches',
      ['controller', 'service']
    );

    return {
      module: WorkspaceBranchesModule,
      imports: [await GitSyncModule.register(configs), await AppGitModule.register(configs)],
      controllers: isMainImport ? [WorkspaceBranchController] : [],
      providers: [WorkspaceBranchService, FeatureAbilityFactory],
      exports: [WorkspaceBranchService],
    };
  }
}
