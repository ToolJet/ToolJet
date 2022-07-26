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
import { FilesService } from '@services/files.service';
import { File } from 'src/entities/file.entity';
import { AppsService } from '@services/apps.service';
import { AppUser } from 'src/entities/app_user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppImportExportService } from '@services/app_import_export.service';
import { DataSourcesService } from '@services/data_sources.service';
import { CredentialsService } from '@services/credentials.service';
import { Credential } from 'src/entities/credential.entity';

@Module({
  controllers: [OrgEnvironmentVariablesController],
  imports: [
    TypeOrmModule.forFeature([
      App,
      OrgEnvironmentVariable,
      User,
      OrganizationUser,
      Organization,
      File,
      AppVersion,
      AppUser,
      DataSource,
      DataQuery,
      FolderApp,
      GroupPermission,
      AppGroupPermission,
      Credential,
    ]),
    CaslModule,
  ],
  providers: [
    OrgEnvironmentVariablesService,
    UsersService,
    EncryptionService,
    AppsService,
    FilesService,
    AppImportExportService,
    DataSourcesService,
    CredentialsService,
  ],
})
export class OrgEnvironmentVariablesModule {}
