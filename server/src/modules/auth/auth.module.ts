import { Module } from '@nestjs/common';
import { AuthService } from '../../services/auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { UsersService } from '../../services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { OrganizationUser } from '../../entities/organization_user.entity';
import { UsersModule } from '../users/users.module';
import { OrganizationsService } from 'src/services/organizations.service';
import { OrganizationUsersService } from 'src/services/organization_users.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([User, Organization, OrganizationUser]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  providers: [AuthService, JwtStrategy, UsersService, OrganizationsService, OrganizationUsersService],
  exports: [AuthService],
})
export class AuthModule {}