import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MetaModule } from '@modules/meta/module';
import { RolesRepository } from '@modules/roles/repository';
import { EncryptionModule } from '@modules/encryption/module';
import { SessionScheduler } from './scheduler';
import { UserRepository } from '@modules/users/repository';
import { AppsRepository } from '@modules/apps/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { FeatureAbilityFactory } from './ability';

export class SessionModule {
  static async register(config: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(config.IS_GET_CONTEXT);
    const { SessionService } = await import(`${importPath}/session/service`);
    const { SessionController } = await import(`${importPath}/session/controller`);
    const { SessionUtilService } = await import(`${importPath}/session/util.service`);
    const { JwtStrategy } = await import(`${importPath}/session/jwt/jwt.strategy`);

    return {
      module: SessionModule,
      imports: [
        await EncryptionModule.register(config),
        await MetaModule.register(config),
        PassportModule,
        JwtModule.registerAsync({
          useFactory: (config: ConfigService) => {
            return {
              secret: config.get<string>('SECRET_KEY_BASE'),
            };
          },
          inject: [ConfigService],
        }),
      ],
      controllers: [SessionController],
      providers: [
        RolesRepository,
        SessionService,
        SessionUtilService,
        UserRepository,
        AppsRepository,
        OrganizationRepository,
        OrganizationUsersRepository,
        GroupPermissionsRepository,
        JwtStrategy,
        SessionScheduler,
        FeatureAbilityFactory,
      ],
      exports: [SessionUtilService],
    };
  }
}
