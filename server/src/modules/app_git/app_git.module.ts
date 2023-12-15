import { GitSyncController } from '@controllers/git_sync.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitSyncService } from '@services/git_sync.service';
import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { User } from 'src/entities/user.entity';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppsModule } from '../apps/apps.module';
import { AppsService } from '@services/apps.service';
import { AppUser } from 'src/entities/app_user.entity';
import { CaslModule } from '../casl/casl.module';
// import { AppsAbilityFactory } from '../casl/abilities/apps-ability.factory';
import { UsersService } from '@services/users.service';
import { FilesService } from '@services/files.service';
import { Organization } from 'src/entities/organization.entity';
import { File } from 'src/entities/file.entity';
import { AppImportExportService } from '@services/app_import_export.service';
import { DataSourcesService } from '@services/data_sources.service';
import { AppEnvironmentService } from '@services/app_environments.service';
import { Plugin } from 'src/entities/plugin.entity';
import { PluginsHelper } from 'src/helpers/plugins.helper';
import { CredentialsService } from '@services/credentials.service';
import { EncryptionService } from '@services/encryption.service';
import { DataSource } from 'src/entities/data_source.entity';
import { Credential } from 'src/entities/credential.entity';
import { ImportExportResourcesService } from '@services/import_export_resources.service';
import { TooljetDbImportExportService } from '@services/tooljet_db_import_export_service';
import { AuditLoggerService } from '@services/audit_logger.service';
import { TooljetDbService } from '@services/tooljet_db.service';

@Module({
  controllers: [GitSyncController],
  imports: [
    AppsModule,
    CaslModule,
    TypeOrmModule.forFeature([
      AppGitSync,
      OrganizationGitSync,
      User,
      App,
      AppVersion,
      AppUser,
      Organization,
      File,
      Plugin,
      DataSource,
      Credential,
    ]),
  ],
  providers: [
    GitSyncService,
    AppsService,
    UsersService,
    FilesService,
    AppImportExportService,
    DataSourcesService,
    AppEnvironmentService,
    PluginsHelper,
    CredentialsService,
    AuditLoggerService,
    TooljetDbService,
    EncryptionService,
    ImportExportResourcesService,
    TooljetDbImportExportService,
  ],
})
export class AppGitModule {}
