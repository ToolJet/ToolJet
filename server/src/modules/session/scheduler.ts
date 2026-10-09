import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';
import { PersonalAccessTokenScope } from '@modules/external-apis/constants';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserSessions } from 'src/entities/user_sessions.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager, LessThan } from 'typeorm';

@Injectable()
export class SessionScheduler {
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    console.log('starting job to clear expired pat and sessions at ', new Date().toISOString());
    await dbTransactionWrap(async (manager: EntityManager) => {
      // scope filter: only embed session tickets (scope='app') are trash when expired.
      // Workspace PATs (scope='workspace') must SURVIVE expiry — the settings UI lists
      // them with an "Expired" badge; silently deleting them would look like data loss.
      await manager.delete(UserPersonalAccessToken, {
        scope: PersonalAccessTokenScope.APP,
        expiresAt: LessThan(new Date()),
      });
      await manager.delete(UserSessions, {
        expiry: LessThan(new Date()),
      });
    });
  }
}
