import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from '../casl/casl.module';
import { AuditLog } from 'src/entities/audit_log.entity';
import { AuditLoggerService } from '@services/audit_logger.service';
import { AuditLogsController } from '@controllers/audit_logs.controller';
import { AuditLogsQueryService } from '@services/audit_logs_query.service';

@Module({
  controllers: [AuditLogsController],
  imports: [TypeOrmModule.forFeature([AuditLog]), CaslModule],
  providers: [AuditLoggerService, AuditLogsQueryService],
})
export class AuditLogsModule {}
