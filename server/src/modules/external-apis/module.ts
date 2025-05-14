import { FeatureAbilityFactory } from './ability';
import { GroupPermissionsModule } from '@modules/group-permissions/module';
import { RolesModule } from '@modules/roles/module';
import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { ExternalApiSecurityGuard } from './guards/external-api-security.guard';
import { RolesRepository } from '@modules/roles/repository';
export class ExternalApiModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { ExternalApisController } = await import(`${importPath}/external-apis/controller`);
    const { ExternalApisService } = await import(`${importPath}/external-apis/service`);
    const { ExternalApiUtilService } = await import(`${importPath}/external-apis/util.service`);

    return {
      module: ExternalApiModule,
      imports: [await RolesModule.register(configs), await GroupPermissionsModule.register(configs)],
      providers: [
        ExternalApiUtilService,
        ExternalApisService,
        ExternalApiSecurityGuard,
        FeatureAbilityFactory,
        RolesRepository,
      ],
      controllers: [ExternalApisController],
      exports: [ExternalApiUtilService],
    };
  }
}
