import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';

export class EncryptionModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { EncryptionService, CredentialsService } = await this.getProviders(configs, 'encryption', [
      'service',
      'services/credentials.service',
    ]);

    return {
      module: EncryptionModule,
      imports: [],
      providers: isMainImport ? [] : [EncryptionService, CredentialsService],
      exports: isMainImport ? [] : [EncryptionService, CredentialsService],
    };
  }
}
