import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { MetaModule } from '@modules/meta/module';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { SessionModule } from '@modules/session/module';
import { OrganizationUsersModule } from '@modules/organization-users/module';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { UserRepository } from '@modules/users/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { RolesModule } from '@modules/roles/module';
import { FeatureAbilityFactory } from './ability';
import { SetupOrganizationsModule } from '@modules/setup-organization/module';

export class OnboardingModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { OnboardingService } = await import(`${importPath}/onboarding/service`);
    const { OnboardingUtilService } = await import(`${importPath}/onboarding/util.service`);
    const { OnboardingController } = await import(`${importPath}/onboarding/controller`);

    return {
      module: OnboardingModule,
      imports: [
        await MetaModule.register(configs),
        await RolesModule.register(configs),
        await InstanceSettingsModule.register(configs),
        await SessionModule.register(configs),
        await OrganizationUsersModule.register(configs),
        await SetupOrganizationsModule.register(configs),
      ],
      providers: [
        OnboardingService,
        OnboardingUtilService,
        OrganizationUsersRepository,
        UserRepository,
        OrganizationRepository,
        FeatureAbilityFactory,
      ],
      controllers: [OnboardingController],
      exports: [OnboardingUtilService],
    };
  }
}
