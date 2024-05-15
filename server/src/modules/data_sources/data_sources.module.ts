import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourcesController } from '../../../src/controllers/data_sources.controller';
import { GlobalDataSourcesController } from '@controllers/global_data_sources.controller';
import { DataSourcesService } from '../../../src/services/data_sources.service';
import { DataSource } from '../../../src/entities/data_source.entity';
import { CredentialsService } from '../../../src/services/credentials.service';
import { Credential } from '../../../src/entities/credential.entity';
import { EncryptionService } from '../../../src/services/encryption.service';
import { AppsService } from '@services/apps.service';
import { App } from 'src/entities/app.entity';
import { File } from 'src/entities/file.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { CaslModule } from '../casl/casl.module';
import { DataQueriesService } from '@services/data_queries.service';
import { DataQuery } from 'src/entities/data_query.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UsersService } from '@services/users.service';
import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { AppImportExportService } from '@services/app_import_export.service';
import { FilesService } from '@services/files.service';
import { PluginsService } from '@services/plugins.service';
import { PluginsHelper } from 'src/helpers/plugins.helper';
import { Plugin } from 'src/entities/plugin.entity';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { AppEnvironmentService } from '@services/app_environments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DataSource,
      DataQuery,
      Credential,
      OrgEnvironmentVariable,
      App,
      File,
      Plugin,
      AppVersion,
      AppUser,
      FolderApp,
      GroupPermission,
      AppGroupPermission,
      User,
      OrganizationUser,
      Organization,
    ]),
    CaslModule,
  ],
  providers: [
    DataSourcesService,
    CredentialsService,
    EncryptionService,
    AppsService,
    DataQueriesService,
    UsersService,
    AppImportExportService,
    FilesService,
    PluginsService,
    PluginsHelper,
    AppEnvironmentService,
  ],
  controllers: [DataSourcesController, GlobalDataSourcesController],
})
export class DataSourcesModule {}
