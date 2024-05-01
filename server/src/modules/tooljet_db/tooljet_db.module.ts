import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from '../../../src/entities/credential.entity';
import { TooljetDbController } from '@controllers/tooljet_db.controller';
import { CaslModule } from '../casl/casl.module';
import { TooljetDbService } from '@services/tooljet_db.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { InternalTable } from 'src/entities/internal_table.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { TableCountGuard } from '@ee/licensing/guards/table.guard';
import { TooljetDbBulkUploadService } from '@services/tooljet_db_bulk_upload.service';
import { AuditLoggerService } from '@services/audit_logger.service';
import { AuditLogsListener } from 'src/listeners/audit_logs.listener';
import { TooljetDbOperationsService } from '@services/tooljet_db_operations.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Credential, InternalTable, AppUser]), CaslModule],
  controllers: [TooljetDbController],
  providers: [
    TooljetDbService,
    TooljetDbBulkUploadService,
    TooljetDbOperationsService,
    PostgrestProxyService,
    TableCountGuard,
    AuditLoggerService,
    AuditLogsListener,
  ],
  exports: [TooljetDbOperationsService],
})
export class TooljetDbModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const enableTooljetDb = this.configService.get('ENABLE_TOOLJET_DB') === 'true';
    console.log(`ToolJet Database enabled: ${enableTooljetDb}`);
  }
}
