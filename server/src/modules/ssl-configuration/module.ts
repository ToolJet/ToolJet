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
      NginxProcessService,
      NginxConfigurationService,
      CertificateAcquisitionService,
      SslBootstrapService,
    } = await this.getProviders(
      configs,
      'ssl-configuration',
      [
        'service',
        'controller',
        'ssl-lifecycle.service',
        'ssl-renewal.scheduler',
        'nginx-process.service',
        'nginx-configuration.service',
        'certificate-acquisition.service',
        'ssl-bootstrap.service',
      ]
    );

    return {
      module: SslConfigurationModule,
      providers: [
        SslConfigurationService,
        SslConfigurationRepository,
        SslCertificateLifecycleService,
        SslCertificateRenewalScheduler,
        NginxProcessService,
        NginxConfigurationService,
        CertificateAcquisitionService,
        SslBootstrapService,
      ],
      controllers: isMainImport ? [SslConfigurationController] : [],
      exports: [
        SslConfigurationService,
        SslCertificateLifecycleService,
        NginxProcessService,
        NginxConfigurationService,
        CertificateAcquisitionService,
        SslBootstrapService,
      ],
    };
  }
}
