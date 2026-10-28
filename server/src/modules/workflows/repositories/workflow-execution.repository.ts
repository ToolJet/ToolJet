import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { App } from '@entities/app.entity';
import { AppsRepository } from '@modules/apps/repository';
import { AppVersion } from '@entities/app_version.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { ExecutionListFilters, ExecutionListRow } from '../types/execution-list';

export const STATUS_FILTER_TO_PREDICATE: Record<string, string> = {
  running:
    "(execution.executed = false AND execution.status NOT IN ('waiting', 'waiting_for_delay', 'terminated', 'failure'))",
  waiting: "(execution.status IN ('waiting', 'waiting_for_delay'))",
  success: "(execution.executed = true AND execution.status = 'success')",
  failed: "(execution.executed = true AND execution.status = 'failure')",
  // Not gated on executed: older terminated rows have executed = false.
  terminated: "(execution.status = 'terminated')",
};

@Injectable()
export class WorkflowExecutionRepository extends Repository<WorkflowExecution> {
  constructor(
    private dataSource: DataSource,
    private readonly appsRepository: AppsRepository
  ) {
    super(WorkflowExecution, dataSource.createEntityManager());
  }

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

    const total = await idQuery.getCount();

    idQuery
      .select('execution.id')
      .orderBy('execution.createdAt', 'DESC')
      // id tiebreaker: created_at ties would repeat or drop rows across pages.
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

    const byId = new Map(decorated.map((row) => [row.id, row]));
    const rows = ids
      .map((id) => byId.get(id))
      .filter((row): row is WorkflowExecution => row !== undefined) as ExecutionListRow[];

    // The join above carries raw `apps.name`, which is NULL for workflows created since the name
    // moved onto app_versions. Resolve the canonical name the Workflows page shows.
    await this.appsRepository.overlayWorkflowNames(
      organizationId,
      rows.map((row) => row.app).filter((app): app is App => !!app)
    );

    return { rows, total };
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
      // Subquery, not join: id query must stay join-free for LIMIT pushdown.
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
