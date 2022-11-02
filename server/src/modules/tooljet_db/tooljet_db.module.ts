import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from '../../../src/entities/credential.entity';
import { TooljetDbController } from '@controllers/tooljet_db.controller';
import { CaslModule } from '../casl/casl.module';
import { TooljetDbService } from '@services/tooljet_db.service';
import { CredentialsService } from '@services/credentials.service';
import { EncryptionService } from '@services/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([Credential]), CaslModule],
  controllers: [TooljetDbController],
  providers: [TooljetDbService, EncryptionService, CredentialsService],
})
export class TooljetDbModule {}
