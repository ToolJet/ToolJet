import { DynamicModule } from '@nestjs/common';
import { UserRepository } from '@modules/users/repositories/repository';
import { FilesRepository } from '@modules/files/repository';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { TotpUtilService } from '@modules/auth/mfa/totp-util.service';
import { UserMfaRepository } from '@modules/auth/mfa/repository';
import { InstanceSettingsModule } from '@modules/instance-settings/module';

export class ProfileModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { ProfileService, ProfileController, ProfileUtilService } = await this.getProviders(configs, 'profile', [
      'service',
      'controller',
      'util.service',
    ]);

    return {
      module: ProfileModule,
      imports: [await InstanceSettingsModule.register(configs)],
      providers: [
        FilesRepository,
        UserRepository,
        ProfileService,
        ProfileUtilService,
        FeatureAbilityFactory,
        TotpUtilService,
        UserMfaRepository,
      ],
      controllers: isMainImport ? [ProfileController] : [],
      exports: [ProfileUtilService],
    };
  }
}
