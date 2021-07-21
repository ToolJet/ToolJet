import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationUsersService } from '@services/organization_users.service';
import { UsersService } from '@services/users.service';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import { CaslAbilityFactory } from './casl-ability.factory';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, OrganizationUser])],
  providers: [CaslAbilityFactory, OrganizationUsersService, UsersService],
  exports: [CaslAbilityFactory]
})

export class CaslModule { }
