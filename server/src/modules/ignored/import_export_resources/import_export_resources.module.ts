import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportExportResourcesController } from '@controllers/import_export_resources.controller';
import { TooljetDbService } from '@services/tooljet_db.service';
import { ImportExportResourcesService } from '@services/import_export_resources.service';
import { AppImportExportService } from '@services/app_import_export.service';
import { TooljetDbImportExportService } from '@services/tooljet_db_import_export_service';
import { DataSourcesService } from '@services/data_sources.service';
import { AppEnvironmentService } from '@ee/app-environments/service';
import { Plugin } from 'src/entities/plugin.entity';
import { PluginsHelper } from 'src/helpers/plugins.helper';
import { CredentialsService } from '@services/credentials.service';
import { DataSource } from 'src/entities/data_source.entity';
import { PluginsModule } from '../plugins/plugins.module';
import { Credential } from '../../../src/entities/credential.entity';
import { CaslModule } from '../casl/casl.module';
import { AppsService } from '@services/apps.service';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { TooljetDbOperationsService } from '@services/tooljet_db_operations.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { TooljetDbModule } from '../tooljet_db/tooljet_db.module';
import { UserResourcePermissionsModule } from '@modules/user_resource_permissions/user_resource_permissions.module';
import { UsersModule } from '@modules/users/users.module';
import { EncryptionModule } from '@modules/encryption/module';

const imports = [
  PluginsModule,
  CaslModule,
  TypeOrmModule.forFeature([User, Organization, AppUser, AppVersion, App, Credential, Plugin, DataSource]),
  TooljetDbModule,
  UserResourcePermissionsModule,
  UsersModule,
  EncryptionModule,
];

@Module({
  imports,
  controllers: [ImportExportResourcesController],
  providers: [
    ImportExportResourcesService,
    AppImportExportService,
    TooljetDbImportExportService,
    DataSourcesService,
    AppEnvironmentService,
    TooljetDbService,
    PluginsHelper,
    AppsService,
    CredentialsService,
    TooljetDbOperationsService,
    PostgrestProxyService,
  ],
  exports: [ImportExportResourcesService],
})
export class ImportExportResourcesModule {}
