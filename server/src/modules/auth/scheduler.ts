import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager, LessThan } from 'typeorm';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { UserMfa } from '@entities/user_mfa.entity';
import { TransactionLogger } from '@modules/logging/service';

@Injectable()
export class MfaCleanupScheduler {
  constructor(private readonly transactionLogger: TransactionLogger) {}
  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async handleCron() {
    this.transactionLogger.log('starting job to clear expired MFA records at ', new Date().toISOString());

    const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(UserMfa, {
        last_sent_at: LessThan(threshold),
      });
    });
  }
}
