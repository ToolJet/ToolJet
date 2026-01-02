import { DynamicModule } from '@nestjs/common';
import { RolesRepository } from './repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { FeatureAbilityFactory } from '@modules/group-permissions/ability';
import { SubModule } from '@modules/app/sub-module';
export class RolesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { RolesController, RolesService, RolesUtilService } = await this.getProviders(configs, 'roles', [
      'controller',
      'service',
      'util.service',
    ]);
    return {
      module: RolesModule,
      controllers: [RolesController],
      providers: [RolesService, RolesRepository, GroupPermissionsRepository, RolesUtilService, FeatureAbilityFactory],
      exports: [RolesUtilService],
    };
  }
}
