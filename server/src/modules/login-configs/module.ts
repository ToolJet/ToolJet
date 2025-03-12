import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { OrganizationRepository } from '@modules/organizations/repository';
import { SSOConfigsRepository } from './repository';
import { EncryptionModule } from '@modules/encryption/module';
import { FeatureAbilityFactory } from './ability';

export class LoginConfigsModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { LoginConfigsService } = await import(`${importPath}/login-configs/service`);
    const { LoginConfigsController } = await import(`${importPath}/login-configs/controller`);
    const { LoginConfigsUtilService } = await import(`${importPath}/login-configs/util.service`);
    const { SSOGuard } = await import(`${importPath}/licensing/guards/sso.guard`);
    const { FeatureGuard } = await import(`${importPath}/licensing/guards/feature.guard`);

    return {
      module: LoginConfigsModule,
      imports: [await InstanceSettingsModule.register(configs), await EncryptionModule.register(configs)],
      controllers: [LoginConfigsController],
      providers: [
        LoginConfigsService,
        LoginConfigsUtilService,
        OrganizationRepository,
        SSOConfigsRepository,
        FeatureAbilityFactory,
        SSOGuard,
        FeatureGuard,
      ],
      exports: [LoginConfigsUtilService],
    };
  }
}
