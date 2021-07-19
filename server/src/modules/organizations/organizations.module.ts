import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationUser } from '../../entities/organization_user.entity';
import { Organization } from '../../entities/organization.entity';
import { OrganizationsService } from 'src/services/organizations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationUser])],
  providers: [OrganizationsService],
  controllers: [],
})
export class OrganizationsModule {}
