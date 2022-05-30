import { Module } from '@nestjs/common';
import { LibraryAppsController } from '@controllers/library_apps.controller';
import { LibraryAppCreationService } from '@services/library_app_creation.service';
import { AppImportExportService } from '@services/app_import_export.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { DataSourcesService } from '@services/data_sources.service';
import { CredentialsService } from '@services/credentials.service';
import { EncryptionService } from '@services/encryption.service';
import { Credential } from 'src/entities/credential.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { CaslModule } from '../casl/casl.module';
import { FilesService } from '@services/files.service';
import { File } from 'src/entities/file.entity';
import { ExtensionsService } from '@services/extensions.service';
import { Extension } from 'src/entities/extension.entity';

@Module({
  imports: [TypeOrmModule.forFeature([App, Credential, File, Extension, DataSource]), CaslModule],
  providers: [
    EncryptionService,
    CredentialsService,
    DataSourcesService,
    LibraryAppCreationService,
    AppImportExportService,
    FilesService,
    ExtensionsService,
  ],
  controllers: [LibraryAppsController],
})
export class LibraryAppModule {}
