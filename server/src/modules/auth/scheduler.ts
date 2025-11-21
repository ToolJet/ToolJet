import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager, LessThan } from 'typeorm';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { UserMfa } from '@entities/user_mfa.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class MfaCleanupScheduler {
  constructor(private readonly logger: Logger) {}
  // Runs every day at midnight — you can change to EVERY_HOUR if needed
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('starting job to clear expired MFA records at ', new Date().toISOString());

    const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(UserMfa, {
        last_sent_at: LessThan(threshold),
      });
    });
  }
}
