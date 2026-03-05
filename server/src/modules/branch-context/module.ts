import { DynamicModule, Module } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { BranchContextService } from '@modules/workspace-branches/branch-context.service';

/**
 * Global module that provides BranchContextService to all modules.
 *
 * BranchContextService is a cross-cutting concern: many modules (DataSources,
 * Folders, FolderApps, OrganizationConstants) need it to resolve the active
 * workspace branch. Keeping it in a standalone global module avoids circular
 * dependencies that would arise if those modules imported WorkspaceBranchesModule.
 *
 * CE stub always returns null; EE version queries OrganizationGitSync / WorkspaceBranch.
 *
 * The static import of BranchContextService serves as the injection token that all
 * consumer modules reference. In EE mode, getProviders() loads the EE subclass;
 * useClass ensures NestJS instantiates it under the CE token so DI resolves correctly.
 */
@Module({})
export class BranchContextModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { BranchContextService: BranchContextServiceImpl } = await this.getProviders(
      configs,
      'workspace-branches',
      ['branch-context.service']
    );

    return {
      module: BranchContextModule,
      global: true,
      providers: [{ provide: BranchContextService, useClass: BranchContextServiceImpl }],
      exports: [BranchContextService],
    };
  }
}
