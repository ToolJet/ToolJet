import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { InstanceSettingsModule } from '@modules/instance-settings/module';

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

    // Conditionally exclude lifecycle services during migrations
    const providers = [
      SslConfigurationService,
      NginxProcessService,
      NginxConfigurationService,
      CertificateAcquisitionService,
      SslBootstrapService,
    ];

    const exports = [
      SslConfigurationService,
      NginxProcessService,
      NginxConfigurationService,
      CertificateAcquisitionService,
      SslBootstrapService,
    ];

    // Only include lifecycle services during normal runtime (not migrations)
    if (!configs?.IS_GET_CONTEXT) {
      providers.push(SslCertificateLifecycleService);
      providers.push(SslCertificateRenewalScheduler);
      exports.push(SslCertificateLifecycleService);
    }

    return {
      module: SslConfigurationModule,
      imports: [await InstanceSettingsModule.register(configs)],
      providers,
      controllers: isMainImport ? [SslConfigurationController] : [],
      exports,
    };
  }
}
