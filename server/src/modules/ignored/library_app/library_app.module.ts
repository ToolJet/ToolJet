import { Module } from '@nestjs/common';
import { LibraryAppsController } from '@controllers/library_apps.controller';
import { LibraryAppCreationService } from '@services/library_app_creation.service';
import { AppImportExportService } from '@services/app_import_export.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { DataSourcesService } from '@services/data_sources.service';
import { CredentialsService } from '@services/credentials.service';
import { Credential } from 'src/entities/credential.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { CaslModule } from '../casl/casl.module';
import { FilesService } from '@services/files.service';
import { File } from 'src/entities/file.entity';
import { PluginsService } from '@services/plugins.service';
import { Plugin } from 'src/entities/plugin.entity';
import { PluginsHelper } from 'src/helpers/plugins.helper';
import { AppEnvironmentService } from '@ee/app-environments/service';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { ImportExportResourcesModule } from '../import_export_resources/import_export_resources.module';
import { TooljetDbOperationsService } from '@services/tooljet_db_operations.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { TooljetDbService } from '@services/tooljet_db.service';
import { AppsService } from '@services/apps.service';
import { AppUser } from 'src/entities/app_user.entity';
import { TooljetDbModule } from '../tooljet_db/tooljet_db.module';
import { UserResourcePermissionsModule } from '@modules/user_resource_permissions/user_resource_permissions.module';
import { UsersModule } from '@modules/users/users.module';
import { EncryptionModule } from '@modules/encryption/module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      App,
      Credential,
      File,
      Plugin,
      DataSource,
      AppEnvironment,
      AppVersion,
      User,
      AppUser,
      Organization,
    ]),
    CaslModule,
    ImportExportResourcesModule,
    TooljetDbModule,
    UserResourcePermissionsModule,
    UsersModule,
    EncryptionModule,
  ],
  providers: [
    CredentialsService,
    DataSourcesService,
    LibraryAppCreationService,
    AppImportExportService,
    FilesService,
    PluginsService,
    PluginsHelper,
    AppEnvironmentService,
    TooljetDbOperationsService,
    TooljetDbService,
    PostgrestProxyService,
    AppsService,
  ],
  controllers: [LibraryAppsController],
})
export class LibraryAppModule {}
