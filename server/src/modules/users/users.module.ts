import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../../services/users.service';
import { OrganizationUser } from '../../entities/organization_user.entity';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { UsersController } from 'src/controllers/users.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { App } from 'src/entities/app.entity';
import { AuditLog } from 'src/entities/audit_log.entity';
import { AuditLoggerService } from '@services/audit_logger.service';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    OrganizationsModule,
    TypeOrmModule.forFeature([User, Organization, OrganizationUser, App, AuditLog]),
    CaslModule,
  ],
  providers: [UsersService, AuditLoggerService],
  controllers: [UsersController],
})
export class UsersModule {}
