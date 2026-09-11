import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiActiveRun } from 'src/entities/ai_active_run.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager } from 'typeorm';

/**
 * Removes ai_active_runs rows left behind by a process that died mid-generation.
 *
 * A run that finishes or throws deletes its own row, so anything still present long
 * after its last heartbeat belongs to a worker that is gone — most often one killed
 * by a rolling deploy while streaming. The provider-switch guard already ignores
 * these (it only counts rows whose heartbeat is inside the two-minute window), so
 * this is purely to stop the table growing on every release.
 *
 * The retention window is deliberately far longer than that guard's cutoff: the rows
 * stop having any effect after two minutes but stay readable for an hour, which is
 * what makes "why did my generation stop?" answerable after the fact.
 *
 * Safe to run on every instance — the delete is idempotent, so pods racing on the
 * same rows costs nothing.
 */
@Injectable()
export class ClearStaleAiRunsScheduler {
  private static readonly RETENTION_MS = 60 * 60 * 1000;

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    const cutoff = new Date(Date.now() - ClearStaleAiRunsScheduler.RETENTION_MS);
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager
        .createQueryBuilder(AiActiveRun, 'ai_active_runs')
        .delete()
        .where('ai_active_runs.heartbeat_at <= :cutoff', { cutoff })
        .execute();
    });
  }
}
