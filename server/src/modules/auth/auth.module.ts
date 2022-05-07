import { Module } from '@nestjs/common';
import { AuthService } from '../../services/auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from '../../services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { OrganizationUser } from '../../entities/organization_user.entity';
import { UsersModule } from '../users/users.module';
import { OrganizationsService } from 'src/services/organizations.service';
import { OrganizationUsersService } from 'src/services/organization_users.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@services/email.service';
import { OauthService, GoogleOAuthService, GitOAuthService } from '@ee/services/oauth';
import { OauthController } from '@ee/controllers/oauth.controller';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { App } from 'src/entities/app.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { GroupPermissionsService } from '@services/group_permissions.service';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { EncryptionService } from '@services/encryption.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      Organization,
      OrganizationUser,
      GroupPermission,
      App,
      SSOConfigs,
      AppGroupPermission,
      UserGroupPermission,
    ]),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('SECRET_KEY_BASE'),
          signOptions: {
            expiresIn: config.get<string | number>('JWT_EXPIRATION_TIME') || '30d',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    UsersService,
    OrganizationsService,
    OrganizationUsersService,
    EmailService,
    OauthService,
    GoogleOAuthService,
    GitOAuthService,
    GroupPermissionsService,
    EncryptionService,
  ],
  controllers: [OauthController],
  exports: [AuthService],
})
export class AuthModule {}
