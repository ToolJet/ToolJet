import { Module } from '@nestjs/common';
import { CaslModule } from '../casl/casl.module';
import { AuditLoggerService } from '@services/audit_logger.service';
import { AuditLogsController } from '@controllers/audit_logs.controller';
import { AuditLogsQueryService } from '@services/audit_logs_query.service';

@Module({
  controllers: [AuditLogsController],
  imports: [CaslModule],
  providers: [AuditLoggerService, AuditLogsQueryService],
  exports: [AuditLoggerService],
})
export class AuditLogsModule {}
