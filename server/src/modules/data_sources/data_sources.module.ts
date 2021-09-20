import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourcesController } from '../../../src/controllers/data_sources.controller';
import { DataSourcesService } from '../../../src/services/data_sources.service';
import { DataSource } from '../../../src/entities/data_source.entity';
import { CredentialsService } from '../../../src/services/credentials.service';
import { Credential } from '../../../src/entities/credential.entity';
import { EncryptionService } from '../../../src/services/encryption.service';
import { AppsService } from '@services/apps.service';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { CaslModule } from '../casl/casl.module';
import { DataQueriesService } from '@services/data_queries.service';
import { DataQuery } from 'src/entities/data_query.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { AppCloneService } from '@services/app_clone.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DataSource,
      DataQuery,
      Credential,
      App,
      AppVersion,
      AppUser,
      FolderApp,
    ]),
    CaslModule,
  ],
  providers: [
    DataSourcesService,
    CredentialsService,
    EncryptionService,
    AppsService,
    DataQueriesService,
    AppCloneService,
  ],
  controllers: [DataSourcesController],
})
export class DataSourcesModule {}
