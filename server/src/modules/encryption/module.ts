import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';

export class EncryptionModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { EncryptionService, CredentialsService } = await this.getProviders(configs, 'encryption', [
      'service',
      'services/credentials.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: EncryptionModule,
      imports: [],
      providers: [EncryptionService, CredentialsService],
      exports: [EncryptionService, CredentialsService],
    });
  }
}
