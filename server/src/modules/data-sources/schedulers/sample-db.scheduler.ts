import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { runPopulateScript } from '../../../../scripts/populate-sample-db';

@Injectable()
export class SampleDBScheduler {
  private readonly logger = new Logger(SampleDBScheduler.name);

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron() {
    this.logger.log('starting job to populate sample data at ' + new Date().toISOString());
    await runPopulateScript();
  }
}
