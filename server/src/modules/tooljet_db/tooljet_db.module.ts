import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourcesService } from '../../../src/services/data_sources.service';
import { DataSource } from '../../../src/entities/data_source.entity';
import { Credential } from '../../../src/entities/credential.entity';
import { Organization } from 'src/entities/organization.entity';
import { TooljetDbController } from '@controllers/tooljet_db.controller';
import { CaslModule } from '../casl/casl.module';
import { TooljetDbService } from '@services/tooljet_db.service';
import { CredentialsService } from '@services/credentials.service';
import { EncryptionService } from '@services/encryption.service';
import { DataQueriesService } from '@services/data_queries.service';
import { DataQuery } from 'src/entities/data_query.entity';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { App } from 'src/entities/app.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([App, DataSource, DataQuery, Organization, OrgEnvironmentVariable, Credential]),
    CaslModule,
  ],
  controllers: [TooljetDbController],
  providers: [TooljetDbService, EncryptionService, DataSourcesService, DataQueriesService, CredentialsService],
})
export class TooljetDbModule {}
