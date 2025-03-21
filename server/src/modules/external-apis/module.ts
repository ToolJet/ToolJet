import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { ExternalApisController } from './controller';
import { ExternalApisService } from './service';
import { ExternalApiSecurityGuard } from '@modules/auth/guards/external-api-security.guard';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([User, OrganizationUser, Organization, GroupPermission, UserGroupPermission]),
  ],
  controllers: [ExternalApisController],
  providers: [ExternalApisService, ExternalApiSecurityGuard],
})
export class ExternalApiModule {}

// need to fix all the imports being used here
