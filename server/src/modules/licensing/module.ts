import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { UserRepository } from '@modules/users/repository';
import { LicenseRepository } from './repository';
import { LicenseInitService, LicenseTermsService } from './interfaces/IService';
import { FeatureAbilityFactory } from './ability';
export class LicenseModule {
  static async forRoot(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { LicenseService } = await import(`${importPath}/licensing/service`);
    const { LicenseUserService } = await import(`${importPath}/licensing/services/user.service`);
    const { LicenseAppsService } = await import(`${importPath}/licensing/services/apps.service`);
    const { LicenseCountsService } = await import(`${importPath}/licensing/services/count.service`);
    const { LicenseTermsService: LicenseTermsServiceImport } = await import(
      `${importPath}/licensing/services/terms.service`
    );
    const { LicenseDecryptService } = await import(`${importPath}/licensing/services/decrypt.service`);
    const { LicenseWorkflowsService } = await import(`${importPath}/licensing/services/workflows.service`);
    const { LicenseInitService: LicenseInitServiceImport } = await import(
      `${importPath}/licensing/services/init.service`
    );
    const { LicenseOrganizationService } = await import(`${importPath}/licensing/services/organization.service`);
    const { LicenseUtilService } = await import(`${importPath}/licensing/util.service`);

    const { LicenseController } = await import(`${importPath}/licensing/controller`);
    const { LicenseUserController } = await import(`${importPath}/licensing/controllers/user.controller`);
    const { LicensePlansController } = await import(`${importPath}/licensing/controllers/plans.controller`);
    const { LicenseAuditLogsController } = await import(`${importPath}/licensing/controllers/audit-logs.controller`);
    const { LicenseWorkflowsController } = await import(`${importPath}/licensing/controllers/workflows.controller`);
    const { LicenseAppsController } = await import(`${importPath}/licensing/controllers/apps.controller`);
    const { LicenseOrganizationController } = await import(
      `${importPath}/licensing/controllers/organization.controller`
    );

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
