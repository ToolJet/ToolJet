import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgEnvironmentVariable } from '../../entities/org_envirnoment_variable.entity';
import { OrgEnvironmentVariablesController } from '../../controllers/org_environment_variables.controller';
import { OrgEnvironmentVariablesService } from '../../services/org_environment_variables.service';
import { App } from 'src/entities/app.entity';
import { UsersService } from '@services/users.service';
import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { CaslModule } from '../casl/casl.module';
import { EncryptionService } from '@services/encryption.service';

@Module({
  controllers: [OrgEnvironmentVariablesController],
  imports: [TypeOrmModule.forFeature([App, OrgEnvironmentVariable, User, OrganizationUser, Organization]), CaslModule],
  providers: [OrgEnvironmentVariablesService, UsersService, EncryptionService],
})
export class OrgEnvironmentVariablesModule {}
