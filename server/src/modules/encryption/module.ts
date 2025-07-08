import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';

export class EncryptionModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { EncryptionService, CredentialsService } = await this.getProviders(configs, 'encryption', [
      'service',
      'services/credentials.service',
    ]);

    return {
      module: EncryptionModule,
      imports: [],
      providers: [EncryptionService, CredentialsService],
      exports: [EncryptionService, CredentialsService],
    };
  }
}
