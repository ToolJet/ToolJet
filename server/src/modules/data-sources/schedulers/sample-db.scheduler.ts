import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { runPopulateScript } from '../../../../scripts/populate-sample-db';

@Injectable()
export class SampleDBScheduler {
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron() {
    console.log('starting job to populate sample data at ', new Date().toISOString());
    runPopulateScript();
  }
}
