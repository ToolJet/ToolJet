import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourcesController } from 'src/controllers/data_sources.controller';
import { DataSourcesService } from 'src/services/data_sources.service';
import { DataSource } from 'src/entities/data_source.entity';
import { CredentialsService } from 'src/services/credentials.service';
import { Credential } from 'src/entities/credential.entity';
import { EncryptionService } from 'src/services/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([DataSource, Credential])],
  providers: [DataSourcesService, CredentialsService, EncryptionService],
  controllers: [DataSourcesController],
})

export class DataSourcesModule {}
