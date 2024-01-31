import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomStylesController } from '@controllers/custom_styles.controller';
import { CustomStylesService } from '@services/custom_styles.service';
import { CustomStyles } from 'src/entities/custom_styles.entity';
import { AppsService } from '@services/apps.service';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { AppImportExportService } from '@services/app_import_export.service';
import { DataSourcesService } from '@services/data_sources.service';
import { AppEnvironmentService } from '@services/app_environments.service';
import { PluginsHelper } from 'src/helpers/plugins.helper';
import { CredentialsService } from '@services/credentials.service';
import { UsersService } from '@services/users.service';
import { DataSource } from 'src/entities/data_source.entity';
import { Plugin } from 'src/entities/plugin.entity';
import { EncryptionService } from '@services/encryption.service';
import { Credential } from 'src/entities/credential.entity';
import { FilesService } from '@services/files.service';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { File } from 'src/entities/file.entity';
import { CustomStylesAbilityFactory } from '../casl/abilities/custom-styles-ability.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomStyles,
      App,
      AppVersion,
      AppUser,
      DataSource,
      Plugin,
      Credential,
      User,
      Organization,
      File,
    ]),
  ],
  providers: [
    CustomStylesService,
    AppsService,
    AppImportExportService,
    DataSourcesService,
    AppEnvironmentService,
    PluginsHelper,
    CredentialsService,
    UsersService,
    EncryptionService,
    FilesService,
    CustomStylesAbilityFactory,
  ],
  controllers: [CustomStylesController],
})
export class CustomStylesModule {}
