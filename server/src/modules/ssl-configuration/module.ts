import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { SslConfigurationRepository } from './repository';

export class SslConfigurationModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { SslConfigurationService, SslConfigurationController } = await this.getProviders(
      configs,
      'ssl-configuration',
      ['service', 'controller']
    );

    return {
      module: SslConfigurationModule,
      providers: [SslConfigurationService, SslConfigurationRepository],
      controllers: isMainImport ? [SslConfigurationController] : [],
      exports: [SslConfigurationService],
    };
  }
}
