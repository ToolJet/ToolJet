import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';

export class EncryptionModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    const { EncryptionService } = await import(`${importPath}/encryption/service`);
    const { CredentialsService } = await import(`${importPath}/encryption/services/credentials.service`);

    return {
      module: EncryptionModule,
      imports: [],
      providers: [EncryptionService, CredentialsService],
      exports: [EncryptionService, CredentialsService],
    };
  }
}
