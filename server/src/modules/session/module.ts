import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MetaModule } from '@modules/meta/module';
import { RolesRepository } from '@modules/roles/repository';
import { EncryptionModule } from '@modules/encryption/module';
import { UserRepository } from '@modules/users/repositories/repository';
import { AppsRepository } from '@modules/apps/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { FeatureAbilityFactory } from './ability';
import { UserSessionRepository } from './repository';

export class SessionModule extends SubModule {
  static async register(config: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { SessionService, SessionController, SessionUtilService, JwtStrategy } = await this.getProviders(
      config,
      'session',
      ['service', 'controller', 'util.service', 'jwt/jwt.strategy']
    );

    const providerImports = [
      RolesRepository,
      SessionService,
      SessionUtilService,
      UserRepository,
      AppsRepository,
      OrganizationRepository,
      OrganizationUsersRepository,
      GroupPermissionsRepository,
      JwtStrategy,
      FeatureAbilityFactory,
      UserSessionRepository,
    ];

    return {
      module: SessionModule,
      imports: [
        await EncryptionModule.register(config),
        await MetaModule.register(config),
        PassportModule,
        JwtModule.registerAsync({
          useFactory: (config: ConfigService) => ({
            secret: config.get<string>('SECRET_KEY_BASE'),
          }),
          inject: [ConfigService],
        }),
      ],
      controllers: [SessionController],
      providers: providerImports,
      exports: [SessionUtilService],
    };
  }
}
