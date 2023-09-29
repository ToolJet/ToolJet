import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from '../../../src/entities/credential.entity';
import { TooljetDbController } from '@controllers/tooljet_db.controller';
import { CaslModule } from '../casl/casl.module';
import { TooljetDbService } from '@services/tooljet_db.service';
import { CredentialsService } from '@services/credentials.service';
import { EncryptionService } from '@services/encryption.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { TooljetDbBulkUploadService } from '@services/tooljet_db_bulk_upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Credential]), CaslModule],
  controllers: [TooljetDbController],
  providers: [
    TooljetDbService,
    TooljetDbBulkUploadService,
    PostgrestProxyService,
    EncryptionService,
    CredentialsService,
  ],
})
export class TooljetDbModule {}
