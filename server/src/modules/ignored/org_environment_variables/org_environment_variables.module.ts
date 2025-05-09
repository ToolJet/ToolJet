import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgEnvironmentVariable } from '../../entities/org_envirnoment_variable.entity';
import { OrgEnvironmentVariablesController } from '../../controllers/org_environment_variables.controller';
import { OrgEnvironmentVariablesService } from '../../services/org_environment_variables.service';
import { App } from 'src/entities/app.entity';
import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { CaslModule } from '../casl/casl.module';
import { FilesService } from '@services/files.service';
import { Plugin } from 'src/entities/plugin.entity';
import { PluginsService } from '@services/plugins.service';
import { File } from 'src/entities/file.entity';
import { AppsService } from '@services/apps.service';
import { AppUser } from 'src/entities/app_user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppImportExportService } from '@services/app_import_export.service';
import { DataSourcesService } from '@services/data_sources.service';
import { CredentialsService } from '@services/credentials.service';
import { Credential } from 'src/entities/credential.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { PluginsHelper } from 'src/helpers/plugins.helper';
import { AppEnvironmentService } from '@ee/app-environments/service';
import { TooljetDbOperationsService } from '@services/tooljet_db_operations.service';
import { TooljetDbService } from '@services/tooljet_db.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { TooljetDbModule } from '../tooljet_db/tooljet_db.module';
import { UsersModule } from '@modules/users/users.module';
import { EncryptionModule } from '@modules/encryption/module';

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
      Plugin,
      AppVersion,
      AppUser,
      DataSource,
      DataQuery,
      FolderApp,
      Credential,
      AppEnvironment,
    ]),
    CaslModule,
    TooljetDbModule,
    UsersModule,
    EncryptionModule,
  ],
  providers: [
    OrgEnvironmentVariablesService,
    AppsService,
    FilesService,
    PluginsService,
    AppImportExportService,
    DataSourcesService,
    CredentialsService,
    PluginsHelper,
    AppEnvironmentService,
    PostgrestProxyService,
    TooljetDbOperationsService,
    TooljetDbService,
  ],
})
export class OrgEnvironmentVariablesModule {}
