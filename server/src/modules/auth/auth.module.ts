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
import { File } from 'src/entities/file.entity';
import { FilesService } from '@services/files.service';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { GroupPermissionsService } from '@services/group_permissions.service';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { EncryptionService } from '@services/encryption.service';
import { DataSourcesService } from '@services/data_sources.service';
import { CredentialsService } from '@services/credentials.service';
import { DataSource } from 'src/entities/data_source.entity';
import { Credential } from 'src/entities/credential.entity';
import { Plugin } from 'src/entities/plugin.entity';
import { PluginsHelper } from 'src/helpers/plugins.helper';
import { AppEnvironmentService } from '@services/app_environments.service';
import { MetaModule } from '../meta/meta.module';
import { Metadata } from 'src/entities/metadata.entity';
import { MetadataService } from '@services/metadata.service';
import { SessionService } from '@services/session.service';
import { SessionScheduler } from 'src/schedulers/session.scheduler';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      File,
      Organization,
      OrganizationUser,
      GroupPermission,
      App,
      SSOConfigs,
      AppGroupPermission,
      UserGroupPermission,
      DataSource,
      Credential,
      Plugin,
      Metadata,
    ]),
    MetaModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('SECRET_KEY_BASE'),
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
    FilesService,
    GroupPermissionsService,
    EncryptionService,
    DataSourcesService,
    CredentialsService,
    AppEnvironmentService,
    MetadataService,
    PluginsHelper,
    SessionService,
    SessionScheduler,
  ],
  controllers: [OauthController],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
