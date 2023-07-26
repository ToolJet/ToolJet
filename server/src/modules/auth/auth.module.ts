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
import { AuditLog } from 'src/entities/audit_log.entity';
import { AuditLoggerService } from '@services/audit_logger.service';
import { File } from 'src/entities/file.entity';
import { FilesService } from '@services/files.service';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { GroupPermissionsService } from '@services/group_permissions.service';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { EncryptionService } from '@services/encryption.service';
import { OidcOAuthService } from '@ee/services/oauth/oidc_auth.service';
import { InstanceSettingsModule } from '../instance_settings/instance_settings.module';
import { DataSourcesService } from '@services/data_sources.service';
import { CredentialsService } from '@services/credentials.service';
import { DataSource } from 'src/entities/data_source.entity';
import { Credential } from 'src/entities/credential.entity';
import { Plugin } from 'src/entities/plugin.entity';
import { PluginsHelper } from 'src/helpers/plugins.helper';
import { AppEnvironmentService } from '@services/app_environments.service';
import { AppEnvironmentsModule } from '../app_environments/app_environments.module';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { MetaModule } from '../meta/meta.module';
import { Metadata } from 'src/entities/metadata.entity';
import { MetadataService } from '@services/metadata.service';
import { DataSourceGroupPermission } from 'src/entities/data_source_group_permission.entity';
import { SessionService } from '@services/session.service';
import { SessionScheduler } from 'src/schedulers/session.scheduler';
import { LdapService } from '@ee/services/oauth/ldap.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    InstanceSettingsModule,
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
      DataSourceGroupPermission,
      AuditLog,
      DataSource,
      Credential,
      Plugin,
      AppEnvironment,
      AppVersion,
      Metadata,
    ]),
    AppEnvironmentsModule,
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
    AuditLoggerService,
    GitOAuthService,
    FilesService,
    GroupPermissionsService,
    EncryptionService,
    OidcOAuthService,
    DataSourcesService,
    CredentialsService,
    AppEnvironmentService,
    MetadataService,
    PluginsHelper,
    SessionService,
    SessionScheduler,
    LdapService,
  ],
  controllers: [OauthController],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
