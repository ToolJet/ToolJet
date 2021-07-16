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

@Module({
  imports: [TypeOrmModule.forFeature([DataQuery, Credential, DataSource])],
  providers: [DataQueriesService, CredentialsService, EncryptionService, DataSourcesService],
  controllers: [DataQueriesController],
})
export class DataQueriesModule {}
