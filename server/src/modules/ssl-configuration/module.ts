import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { SslServerManagerService } from '@services/ssl-server-manager.service';
import { FeatureAbilityFactory } from './ability';
import { FeatureAbilityGuard } from './ability/guard';
import { AcmeChallengeController } from './acme-challenge.controller';

export class SslConfigurationModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const {
      SslConfigurationService,
      SslConfigurationController,
      SslCertificateLifecycleService,
      SslCertificateRenewalScheduler,
      AcmeClientService,
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
        'acme-client.service',
        'certificate-acquisition.service',
        'ssl-bootstrap.service',
      ]
    );

    const providers = [
      SslConfigurationService,
      AcmeClientService,
      SslServerManagerService,
      CertificateAcquisitionService,
      SslBootstrapService,
      SslCertificateLifecycleService,
      SslCertificateRenewalScheduler,
      FeatureAbilityFactory,
      FeatureAbilityGuard,
    ];

    const exports = [
      SslConfigurationService,
      AcmeClientService,
      SslServerManagerService,
      CertificateAcquisitionService,
      SslBootstrapService,
      SslCertificateLifecycleService,
      SslCertificateRenewalScheduler,
    ];

    return {
      module: SslConfigurationModule,
      imports: [await InstanceSettingsModule.register(configs)],
      providers,
      controllers: isMainImport ? [SslConfigurationController, AcmeChallengeController] : [AcmeChallengeController],
      exports,
    };
  }
}
