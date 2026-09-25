import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { ExecutionListFilters, ExecutionListRow } from '../types/execution-list';

// The UI's status vocabulary is derived from three stores (DB status, BullMQ job state, a Redis
// flag). Only the DB half can be a SQL predicate. `running` therefore means "in flight" — not
// finished — and the finer Queued/Running/Stopping/Unknown split is refined in the browser from
// polled job state.
//
// `executed`, not `status`, is what separates a finished run from a live one. `status` is
// NOT NULL DEFAULT 'success' (migration 1722934934124-AddStatusToWorkflowExecution), so every row
// carries 'success' from the instant it is inserted — before the workflow has run a single node.
// `saveExecutionStatus` is the only writer that means it, and it always sets `executed = true` in
// the same statement. So a bare `status = 'success'` matches every in-flight run as well as every
// successful one, and `status IS NULL` matches nothing at all.
//
// Exported so a test can assert this stays in lockstep with `EXECUTION_STATUS_FILTERS` in
// `../dto/list-executions.dto` — one status vocabulary, checked from both ends, rather than two
// lists that can silently drift apart. The literals below are compile-time constants, never user
// input: the DTO rejects an unrecognized filter before it reaches this map.
export const STATUS_FILTER_TO_PREDICATE: Record<string, string> = {
  // In flight: not finished, and not parked in a status that already means something definite.
  // A live run's status is the 'success' column default, which is why this cannot test for NULL.
  running:
    "(execution.executed = false AND execution.status NOT IN ('waiting', 'waiting_for_delay', 'terminated', 'failure'))",
  // A suspended run is authoritative in the database and deliberately leaves `executed` false.
  waiting: "(execution.status IN ('waiting', 'waiting_for_delay'))",
  success: "(execution.executed = true AND execution.status = 'success')",
  failed: "(execution.executed = true AND execution.status = 'failure')",
  // Not gated on `executed`: terminate only began stamping `executed = true` in this branch, and
  // runs stopped before that are still legitimately Stopped.
  terminated: "(execution.status = 'terminated')",
};

@Injectable()
export class WorkflowExecutionRepository extends Repository<WorkflowExecution> {
  constructor(private dataSource: DataSource) {
    super(WorkflowExecution, dataSource.createEntityManager());
  }

  /**
   * Organization-scoped run history, newest first.
   *
   * Two queries, not one. TypeORM only translates `.skip()/.take()` into a real SQL LIMIT/OFFSET
   * while the query has zero joins (`createLimitOffsetExpression`). Add a join and
   * `getManyAndCount()` silently switches to its "distinct ids" strategy: it runs the entire
   * filtered, joined query with no LIMIT, materializes every matching row, and only then sorts and
   * slices a page off the top. On this table — the module's highest-volume — that is a full sort of
   * the workspace's whole history on every page request.
   *
   * So: paginate ids alone (join-free, real LIMIT, `(organization_id, created_at DESC)` drives an
   * index-order scan that stops after `perPage` rows), then join only to decorate that small page.
   */
  async listForOrganization(
    organizationId: string,
    filters: ExecutionListFilters,
    page: number,
    perPage: number
  ): Promise<{ rows: ExecutionListRow[]; total: number }> {
    const idQuery = this.createQueryBuilder('execution').where('execution.organization_id = :organizationId', {
      organizationId,
    });
    this.applyListFilters(idQuery, filters);

    // getCount() clears skip/take itself, so this counts every matching row, not the page.
    const total = await idQuery.getCount();

    idQuery
      .select('execution.id')
      .orderBy('execution.createdAt', 'DESC')
      // Required, not cosmetic: created_at alone is not a total order. Parallel runs share a
      // millisecond and Postgres may return ties in any order per query, so a tied row could
      // appear on two pages or neither. id is unique, which makes paging stable.
      .addOrderBy('execution.id', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const ids = (await idQuery.getMany()).map((row) => row.id);
    if (ids.length === 0) return { rows: [], total };

    const decorated = await this.createQueryBuilder('execution')
      .leftJoinAndMapOne('execution.app', App, 'app', 'app.id = execution.app_id')
      .leftJoinAndMapOne('execution.appVersion', AppVersion, 'av', 'av.id = execution.app_version_id')
      .leftJoinAndMapOne('execution.environment', AppEnvironment, 'env', 'env.id = execution.environment_id')
      .leftJoinAndMapOne('execution.schedule', WorkflowSchedule, 'sch', 'sch.id = execution.schedule_id')
      .where('execution.id IN (:...ids)', { ids })
      .getMany();

    // `WHERE id IN (...)` does not preserve order, and the id query above is the single place page
    // order is established. Re-sort into it.
    const byId = new Map(decorated.map((row) => [row.id, row]));
    const rows = ids.map((id) => byId.get(id)).filter((row): row is WorkflowExecution => row !== undefined);

    return { rows: rows as ExecutionListRow[], total };
  }

  private applyListFilters(query: SelectQueryBuilder<WorkflowExecution>, filters: ExecutionListFilters): void {
    if (filters.statuses?.length) {
      const predicates = filters.statuses
        .map((status) => STATUS_FILTER_TO_PREDICATE[status])
        .filter((predicate): predicate is string => !!predicate);
      if (predicates.length) query.andWhere(`(${predicates.join(' OR ')})`);
    }
    if (filters.appId) {
      query.andWhere('execution.app_id = :appId', { appId: filters.appId });
    }
    if (filters.environmentId) {
      query.andWhere('execution.environment_id = :environmentId', { environmentId: filters.environmentId });
    }
    if (filters.triggers?.length) {
      query.andWhere('execution.trigger_type IN (:...triggers)', { triggers: filters.triggers });
    }
    if (filters.folderId) {
      // A subquery, never a join: the id query depends on staying join-free for TypeORM to emit a
      // real LIMIT. See the note on listForOrganization.
      query.andWhere(
        'execution.app_id IN (SELECT folder_apps.app_id FROM folder_apps WHERE folder_apps.folder_id = :folderId)',
        { folderId: filters.folderId }
      );
    }
    if (filters.from) {
      query.andWhere('execution.created_at >= :from', { from: filters.from });
    }
    if (filters.to) {
      query.andWhere('execution.created_at <= :to', { to: filters.to });
    }
  }
}
