import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from '../../../src/entities/credential.entity';
import { TooljetDbController } from '@controllers/tooljet_db.controller';
import { CaslModule } from '../casl/casl.module';
import { TooljetDbService } from '@services/tooljet_db.service';
import { CredentialsService } from '@services/credentials.service';
import { EncryptionService } from '@services/encryption.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { InternalTable } from 'src/entities/internal_table.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { TableCountGuard } from '@ee/licensing/guards/table.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Credential, InternalTable, AppUser]), CaslModule],
  controllers: [TooljetDbController],
  providers: [TooljetDbService, PostgrestProxyService, EncryptionService, CredentialsService, TableCountGuard],
})
export class TooljetDbModule {}
