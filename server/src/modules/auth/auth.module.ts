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

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([User, Organization, OrganizationUser, GroupPermission, App]),
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
  ],
  controllers: [OauthController],
  exports: [AuthService],
})
export class AuthModule {}
