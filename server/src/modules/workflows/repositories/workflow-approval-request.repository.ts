import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { App } from '@entities/app.entity';
import { AppsRepository } from '@modules/apps/repository';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { ApprovalListFilters, ApprovalListRow } from '../types/approval-list';

@Injectable()
export class WorkflowApprovalRequestRepository extends Repository<WorkflowApprovalRequest> {
  constructor(
    private dataSource: DataSource,
    private readonly appsRepository: AppsRepository
  ) {
    super(WorkflowApprovalRequest, dataSource.createEntityManager());
  }

  findByToken(token: string): Promise<WorkflowApprovalRequest | null> {
    return this.findOne({ where: { token } });
  }

  findPendingForNode(workflowExecutionId: string, executionNodeId: string): Promise<WorkflowApprovalRequest | null> {
    return this.findOne({ where: { workflowExecutionId, executionNodeId, status: 'pending' } });
  }

  /**
   * Organization-scoped history, newest first. Filters run against the denormalized
   * `organization_id` / `app_id` columns so `(organization_id, created_at DESC)` can serve the
   * WHERE + ORDER BY + LIMIT as an index-order scan with early termination.
   *
   * This has to be two queries, not one `leftJoinAndMapOne(...).skip().take().getManyAndCount()`:
   * TypeORM only ever translates `.skip()/.take()` into a real SQL `LIMIT`/`OFFSET` when the
   * query has zero joins (`createLimitOffsetExpression`, typeorm SelectQueryBuilder). The moment
   * `app`/`node` are joined in, `getManyAndCount()` silently switches to its "distinct ids"
   * pagination strategy: it runs the *entire* filtered, joined query with no LIMIT and no ORDER
   * BY to collect every matching row, and only sorts + slices a page off the top of that fully
   * materialized set afterwards. The org/app/created indexes can serve the WHERE, but never the
   * ORDER BY + LIMIT, because no LIMIT is ever pushed into the scan — confirmed by EXPLAIN
   * ANALYZE showing a full external-merge disk sort of every matching row on every page request.
   *
   * Fix: select and paginate `request.id` alone first (no joins → skip/take DOES become a real
   * LIMIT/OFFSET → the composite index drives an index-order scan that stops after `perPage`
   * rows), then join `app`/`node` only to decorate that already-small page of ids.
   */
  async listForOrganization(
    organizationId: string,
    filters: ApprovalListFilters,
    page: number,
    perPage: number
  ): Promise<{ rows: ApprovalListRow[]; total: number }> {
    const idQuery = this.createQueryBuilder('request').where('request.organization_id = :organizationId', {
      organizationId,
    });
    this.applyListFilters(idQuery, filters);

    // getCount() clears skip/take/limit/offset itself (SelectQueryBuilder#executeCountQuery), so
    // this is the count of every matching row, not the page size.
    const total = await idQuery.getCount();

    idQuery
      .select('request.id')
      // Camelcase property path, not the snake_case column name: TypeORM's orderBy resolves this
      // via `metadata.findColumnWithPropertyPath()` when building the (here, join-free) LIMIT/
      // ORDER BY, and only falls back to the raw string when no joins are present. Keeping the
      // property-path form here regardless keeps this query and the decorate query below
      // consistent and avoids re-introducing the crash that motivated the fallback path.
      .orderBy('request.createdAt', 'DESC')
      // Tiebreaker. `created_at` alone is not a total order: one run with parallel human nodes
      // writes several requests in the same millisecond, and Postgres is free to return ties in
      // any order per query — so a tied row can appear on both page 1 and page 2, or on neither.
      // `id` is unique, which makes the sort total and paging stable. The
      // `(organization_id, created_at DESC)` index still drives the scan; the tiebreaker only
      // orders within a group of rows sharing a timestamp.
      .addOrderBy('request.id', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const ids = (await idQuery.getMany()).map((r) => r.id);
    if (ids.length === 0) return { rows: [], total };

    const decorated = await this.createQueryBuilder('request')
      .leftJoinAndMapOne('request.app', App, 'app', 'app.id = request.app_id')
      .leftJoinAndMapOne('request.node', WorkflowExecutionNode, 'node', 'node.id = request.execution_node_id')
      .leftJoinAndMapOne('request.environment', AppEnvironment, 'env', 'env.id = request.environment_id')
      .where('request.id IN (:...ids)', { ids })
      .getMany();

    // The decorate query deliberately sets no ORDER BY of its own: `WHERE id IN (...)` does not
    // preserve order, and the id query above is the single place page order is established.
    // Re-sort into that order here.
    const byId = new Map(decorated.map((row) => [row.id, row]));
    const rows = ids
      .map((id) => byId.get(id))
      .filter((row): row is WorkflowApprovalRequest => row !== undefined) as ApprovalListRow[];

    // The join above carries raw `apps.name`, which is NULL for workflows created since the name
    // moved onto app_versions. Resolve the canonical name the Workflows page shows.
    await this.appsRepository.overlayWorkflowNames(
      organizationId,
      rows.map((row) => row.app).filter((app): app is App => !!app)
    );

    return { rows, total };
  }

  private applyListFilters(query: SelectQueryBuilder<WorkflowApprovalRequest>, filters: ApprovalListFilters): void {
    if (filters.statuses?.length) {
      query.andWhere('request.status IN (:...statuses)', { statuses: filters.statuses });
    }
    if (filters.appId) {
      query.andWhere('request.app_id = :appId', { appId: filters.appId });
    }
    if (filters.environmentId) {
      query.andWhere('request.environment_id = :environmentId', { environmentId: filters.environmentId });
    }
    if (filters.folderId) {
      // A subquery rather than a join: `listForOrganization` depends on the id query staying
      // join-free, because TypeORM only emits a real SQL LIMIT/OFFSET (and so only lets the
      // composite index drive the scan) while `joinAttributes` is empty. See the note there.
      query.andWhere(
        'request.app_id IN (SELECT folder_apps.app_id FROM folder_apps WHERE folder_apps.folder_id = :folderId)',
        { folderId: filters.folderId }
      );
    }
    if (filters.from) {
      query.andWhere('request.created_at >= :from', { from: filters.from });
    }
    if (filters.to) {
      query.andWhere('request.created_at <= :to', { to: filters.to });
    }
    if (filters.approver) {
      // The snapshot holds ids, group ids and emails in one jsonb blob; a text match covers all
      // three without three separate containment queries.
      query.andWhere('request.approvers_snapshot::text ILIKE :approver', { approver: `%${filters.approver}%` });
    }
  }
}
