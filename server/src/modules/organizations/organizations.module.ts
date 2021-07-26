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

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationUser, User]), CaslModule],
  providers: [OrganizationsService, OrganizationUsersService, UsersService, EmailService], 
  controllers: [OrganizationsController, OrganizationUsersController],
})
export class OrganizationsModule {}
