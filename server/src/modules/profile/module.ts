import { DynamicModule } from '@nestjs/common';
import { UserRepository } from '@modules/users/repositories/repository';
import { FilesRepository } from '@modules/files/repository';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';

export class ProfileModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { ProfileService, ProfileController, ProfileUtilService } = await this.getProviders(configs, 'profile', [
      'service',
      'controller',
      'util.service',
    ]);

    return {
      module: ProfileModule,
      providers: [FilesRepository, UserRepository, ProfileService, ProfileUtilService, FeatureAbilityFactory],
      controllers: [ProfileController],
      exports: [ProfileUtilService],
    };
  }
}
