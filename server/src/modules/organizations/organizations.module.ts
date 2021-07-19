import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationUser } from '../../entities/organization_user.entity';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { OrganizationsService } from 'src/services/organizations.service';
import { OrganizationUsersService } from 'src/services/organization_users.service';
import { OrganizationsController } from 'src/controllers/organizations.controller';
import { OrganizationUsersController } from 'src/controllers/organization_users.controller';
import { UsersService } from 'src/services/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationUser, User])],
  providers: [OrganizationsService, OrganizationUsersService, UsersService],
  controllers: [OrganizationsController, OrganizationUsersController],
})
export class OrganizationsModule {}
