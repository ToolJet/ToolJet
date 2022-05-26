import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationUser } from '../../entities/organization_user.entity';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { OrganizationsService } from '@services/organizations.service';
import { OrganizationUsersService } from '@services/organization_users.service';
import { OrganizationsController } from '@controllers/organizations.controller';
import { OrganizationUsersController } from '@controllers/organization_users.controller';
import { UsersService } from 'src/services/users.service';
import { CaslModule } from '../casl/casl.module';
import { EmailService } from '@services/email.service';
import { FilesService } from '@services/files.service';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { App } from 'src/entities/app.entity';
import { File } from 'src/entities/file.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { AuthService } from '@services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GroupPermissionsService } from '@services/group_permissions.service';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { EncryptionService } from '@services/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      OrganizationUser,
      User,
      File,
      GroupPermission,
      App,
      SSOConfigs,
      AppGroupPermission,
      UserGroupPermission,
    ]),
    CaslModule,
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
    OrganizationsService,
    OrganizationUsersService,
    UsersService,
    EmailService,
    FilesService,
    AuthService,
    GroupPermissionsService,
    EncryptionService,
  ],
  controllers: [OrganizationsController, OrganizationUsersController],
})
export class OrganizationsModule {}
