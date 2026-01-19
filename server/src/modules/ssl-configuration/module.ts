import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { SslConfigurationRepository } from './repository';

export class SslConfigurationModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const {
      SslConfigurationService,
      SslConfigurationController,
      SslCertificateLifecycleService,
      SslCertificateRenewalScheduler,
    } = await this.getProviders(
      configs,
      'ssl-configuration',
      ['service', 'controller', 'ssl-lifecycle.service', 'ssl-renewal.scheduler']
    );

    return {
      module: SslConfigurationModule,
      providers: [
        SslConfigurationService,
        SslConfigurationRepository,
        SslCertificateLifecycleService,
        SslCertificateRenewalScheduler,
      ],
      controllers: isMainImport ? [SslConfigurationController] : [],
      exports: [SslConfigurationService, SslCertificateLifecycleService],
    };
  }
}
