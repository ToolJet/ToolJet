import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserSessions } from 'src/entities/user_sessions.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager, LessThan } from 'typeorm';

@Injectable()
export class SessionScheduler {
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    console.log('starting job to clear expired user and pat sessions at ', new Date().toISOString());
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(UserSessions, {
        expiry: LessThan(new Date()),
      });
    });
  }
}
