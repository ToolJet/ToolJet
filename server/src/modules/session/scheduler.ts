import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserSessions } from 'src/entities/user_sessions.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager, LessThan } from 'typeorm';

@Injectable()
export class SessionScheduler {
  private readonly logger = new Logger(SessionScheduler.name);

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log(`starting job to clear expired pat and sessions at ${new Date().toISOString()}`);
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(UserPersonalAccessToken, {
        expiresAt: LessThan(new Date()),
      });
      await manager.delete(UserSessions, {
        expiry: LessThan(new Date()),
      });
    });
  }
}
