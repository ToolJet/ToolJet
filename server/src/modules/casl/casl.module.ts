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
import { ThreadsAbilityFactory } from './abilities/threads-ability.factory';
import { CommentsAbilityFactory } from './abilities/comments-ability.factory';
import { CaslAbilityFactory } from './casl-ability.factory';
import { FoldersAbilityFactory } from './abilities/folders-ability.factory';
import { AuditLoggerService } from '@services/audit_logger.service';
import { AuditLog } from 'src/entities/audit_log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, OrganizationUser, App, AuditLog])],
  providers: [
    CaslAbilityFactory,
    OrganizationUsersService,
    UsersService,
    EmailService,
    AppsAbilityFactory,
    ThreadsAbilityFactory,
    CommentsAbilityFactory,
    FoldersAbilityFactory,
    AuditLoggerService,
  ],
  exports: [
    CaslAbilityFactory,
    AppsAbilityFactory,
    ThreadsAbilityFactory,
    CommentsAbilityFactory,
    FoldersAbilityFactory,
  ],
})
export class CaslModule {}
