import { DynamicModule } from '@nestjs/common';
import { RolesRepository } from './repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { FeatureAbilityFactory } from '@modules/group-permissions/ability';
import { getImportPath } from '@modules/app/constants';
export class RolesModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { RolesController } = await import(`${importPath}/roles/controller`);
    const { RolesService } = await import(`${importPath}/roles/service`);
    const { RolesUtilService } = await import(`${importPath}/roles/util.service`);
    return {
      module: RolesModule,
      controllers: [RolesController],
      providers: [RolesService, RolesRepository, GroupPermissionsRepository, RolesUtilService, FeatureAbilityFactory],
      exports: [RolesUtilService],
    };
  }
}
