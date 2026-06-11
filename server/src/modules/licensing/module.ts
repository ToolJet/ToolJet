import { DynamicModule } from '@nestjs/common';
import { UserRepository } from '@modules/users/repositories/repository';
import { LicenseRepository } from './repository';
import { LicenseInitService, LicenseTermsService } from './interfaces/IService';
import { FeatureAbilityFactory } from './ability';
import { OrganizationRepository } from '@modules/organizations/repository';
import { SubModule } from '@modules/app/sub-module';
export class LicenseModule extends SubModule {
  static async forRoot(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const {
      LicenseService,
      LicenseUserService,
      LicenseAppsService,
      LicenseCountsService,
      LicenseTermsService: LicenseTermsServiceImport,
      LicenseDecryptService,
      LicenseWorkflowsService,
      LicenseInitService: LicenseInitServiceImport,
      LicenseOrganizationService,
      LicenseUtilService,
      LicenseController,
      LicenseUserController,
      LicensePlansController,
      LicenseAuditLogsController,
      LicenseWorkflowsController,
      LicenseAppsController,
      LicenseOrganizationController,
    } = await this.getProviders(configs, 'licensing', [
      'service',
      'services/user.service',
      'services/apps.service',
      'services/count.service',
      'services/terms.service',
      'services/decrypt.service',
      'services/workflows.service',
      'services/init.service',
      'services/organization.service',
      'util.service',
      'controller',
      'controllers/user.controller',
      'controllers/plans.controller',
      'controllers/audit-logs.controller',
      'controllers/workflows.controller',
      'controllers/apps.controller',
      'controllers/organization.controller',
    ]);

    return {
      module: LicenseModule,
      global: true,
      providers: [
        UserRepository,
        LicenseRepository,
        LicenseService,
        LicenseCountsService,
        {
          provide: LicenseTermsService,
          useClass: LicenseTermsServiceImport,
        },
        {
          provide: LicenseInitService,
          useClass: LicenseInitServiceImport,
        },
        LicenseUserService,
        LicenseOrganizationService,
        LicenseUtilService,
        LicenseAppsService,
        LicenseDecryptService,
        LicenseWorkflowsService,
        FeatureAbilityFactory,
        OrganizationRepository,
      ],
      controllers: [
        LicenseController,
        LicenseUserController,
        LicenseAuditLogsController,
        LicensePlansController,
        LicenseWorkflowsController,
        LicenseOrganizationController,
        LicenseAppsController,
      ],
      exports: [
        LicenseUserService,
        LicenseOrganizationService,
        LicenseTermsService,
        LicenseCountsService,
        LicenseUtilService,
      ],
    };
  }
}
