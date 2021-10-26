import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from '@services/email.service';
import { OrganizationUsersService } from '@services/organization_users.service';
import { UsersService } from '@services/users.service';
import { App } from 'src/entities/app.entity';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import { AppsAbilityFactory } from './abilities/apps-ability.factory';
import { CaslAbilityFactory } from './casl-ability.factory';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, OrganizationUser, App])],
  providers: [CaslAbilityFactory, OrganizationUsersService, UsersService, EmailService, AppsAbilityFactory],
  exports: [CaslAbilityFactory, AppsAbilityFactory],
})
export class CaslModule {}
