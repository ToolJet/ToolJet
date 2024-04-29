import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from '../../../src/entities/credential.entity';
import { TooljetDbController } from '@controllers/tooljet_db.controller';
import { CaslModule } from '../casl/casl.module';
import { TooljetDbService } from '@services/tooljet_db.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { TooljetDbBulkUploadService } from '@services/tooljet_db_bulk_upload.service';
import { TooljetDbOperationsService } from '@services/tooljet_db_operations.service';
import { tooljetDbOrmconfig } from 'ormconfig';

@Module({
  imports: [TypeOrmModule.forFeature([Credential]), TypeOrmModule.forRoot(tooljetDbOrmconfig), CaslModule],
  controllers: [TooljetDbController],
  providers: [TooljetDbService, TooljetDbBulkUploadService, TooljetDbOperationsService, PostgrestProxyService],
  exports: [TooljetDbOperationsService],
})
export class TooljetDbModule {}
