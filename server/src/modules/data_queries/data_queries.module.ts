import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataQuery } from '../../../src/entities/data_query.entity';
import { DataQueriesController } from '../../../src/controllers/data_queries.controller';
import { DataQueriesService } from '../../../src/services/data_queries.service';
import { CredentialsService } from '../../../src/services/credentials.service';
import { EncryptionService } from '../../../src/services/encryption.service';
import { Credential } from '../../../src/entities/credential.entity';
import { DataSourcesService } from '../../../src/services/data_sources.service';
import { DataSource } from '../../../src/entities/data_source.entity';
import { CaslModule } from '../casl/casl.module';
import { AppsService } from '@services/apps.service';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppUser } from 'src/entities/app_user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([App, AppVersion, AppUser, DataQuery, Credential, DataSource]), CaslModule],
  providers: [DataQueriesService, CredentialsService, EncryptionService, DataSourcesService, AppsService],
  controllers: [DataQueriesController],
})
export class DataQueriesModule {}
