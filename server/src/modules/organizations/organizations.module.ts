import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationUser } from '../../entities/organization_user.entity';
import { Organization } from '../../entities/organization.entity';
import { OrganizationsService } from 'src/services/organizations.service';
import { OrganizationUsersService } from 'src/services/organization_users.service';
import { OrganizationsController } from 'src/controllers/organizations.controller';
import { OrganizationUsersController } from 'src/controllers/organization_users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationUser])],
  providers: [OrganizationsService, OrganizationUsersService],
  controllers: [OrganizationsController, OrganizationUsersController],
})
export class OrganizationsModule {}
