import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserSessions } from 'src/entities/user_sessions.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager } from 'typeorm';

@Injectable()
export class SessionScheduler {
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    console.log('starting job to clear expired sessions at ', new Date().toISOString());
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager
        .createQueryBuilder(UserSessions, 'user_sessions')
        .delete()
        .where('user_sessions.expiry < :now', { now: new Date() })
        .execute();
    });
  }
}
