import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SSOResponse } from 'src/entities/sso_response.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager } from 'typeorm';

@Injectable()
export class ClearSSOResponseScheduler {
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron() {
    console.log('starting job to clear saved sso responses', new Date().toISOString());
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager
        .createQueryBuilder(SSOResponse, 'sso_responses')
        .delete()
        .where('sso_responses.expiry <= :currentTime', { currentTime: new Date() })
        .execute();
    });
  }
}
