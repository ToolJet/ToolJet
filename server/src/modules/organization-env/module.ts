import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { EncryptionModule } from '@modules/encryption/module';
import { OrganizationRepository } from '@modules/organizations/repository';

export class OrganizationEnvModule extends SubModule {
  private static cachedModule: DynamicModule | null = null;

  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    if (this.cachedModule) {
      return this.cachedModule;
    }

    const { OrganizationEnvRegistryService } = await this.getProviders(configs, 'organization-env', [
      'organization-env-registry.service',
    ]);

    this.cachedModule = {
      module: OrganizationEnvModule,
      global: true,
      imports: [await EncryptionModule.register(configs)],
      providers: [OrganizationEnvRegistryService, OrganizationRepository],
      exports: [OrganizationEnvRegistryService],
    };

    return this.cachedModule;
  }
}
