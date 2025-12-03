import { dbTransactionWrap } from '@helpers/database.helper';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditLog } from 'src/entities/audit_log.entity';
import { EntityManager, LessThan } from 'typeorm';
import { Logger } from 'nestjs-pino';

@Injectable()
export class AuditLogsClearScheduler {
  constructor(private readonly configService: ConfigService,
    private readonly logger: Logger) {}
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    this.logger.log('Starting job to clear audit logs');
    // To avoid clearing if audit logs -> set AUDIT_LOGS_RETENTION_PERIOD=0
    const auditLogsRetentionPeriod = this.configService.get<string>('AUDIT_LOGS_RETENTION_PERIOD');
    const retentionPeriodNum =
      !isNaN(Number(auditLogsRetentionPeriod)) && auditLogsRetentionPeriod !== ''
        ? Number(auditLogsRetentionPeriod)
        : 90;

    if (retentionPeriodNum === 0) {
      this.logger.debug('Audit logs retention period is set to 0. Skipping clearing of logs.');
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionPeriodNum);

    this.logger.log(`Starting job to clear logs older than ${retentionPeriodNum} days at ${new Date().toISOString()}`);

    await dbTransactionWrap(async (manager: EntityManager) => {
      return manager.delete(AuditLog, {
        createdAt: LessThan(cutoffDate),
      });
    });

    this.logger.debug('Audit logs cleared successfully.');
  }
}
