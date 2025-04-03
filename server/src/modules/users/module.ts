import { getImportPath } from '@modules/app/constants';
import { DynamicModule } from '@nestjs/common';
import { UserRepository } from './repository';
import { SessionModule } from '@modules/session/module';
import { FeatureAbilityFactory } from './ability';

export class UsersModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { UsersService } = await import(`${importPath}/users/service`);
    const { UsersController } = await import(`${importPath}/users/controller`);
    const { UsersUtilService } = await import(`${importPath}/users/util.service`);

    return {
      module: UsersModule,
      imports: [await SessionModule.register(configs)],
      controllers: [UsersController],
      providers: [UsersService, UserRepository, UsersUtilService, FeatureAbilityFactory],
    };
  }
}
