import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { UserRepository } from '@modules/users/repository';
import { FilesRepository } from '@modules/files/repository';
import { FeatureAbilityFactory } from './ability';

export class ProfileModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { ProfileService } = await import(`${importPath}/profile/service`);
    const { ProfileController } = await import(`${importPath}/profile/controller`);
    const { ProfileUtilService } = await import(`${importPath}/profile/util.service`);

    return {
      module: ProfileModule,
      providers: [FilesRepository, UserRepository, ProfileService, ProfileUtilService, FeatureAbilityFactory],
      controllers: [ProfileController],
      exports: [ProfileUtilService],
    };
  }
}
