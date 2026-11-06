import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { App } from '@entities/app.entity';
import { AppsRepository } from '@modules/apps/repository';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { ApprovalListFilters, ApprovalListRow } from '../types/approval-list';

const APPROVER_SNAPSHOT_KEYS = ['users', 'groups', 'emails', 'notificationEmails'] as const;

export const escapeLikePattern = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);

const approverValuesSql = (column: string): string =>
  APPROVER_SNAPSHOT_KEYS.map(
    (key) => `CASE WHEN jsonb_typeof(${column}->'${key}') = 'array' THEN ${column}->'${key}' ELSE '[]'::jsonb END`
  ).join(' || ');

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

    const total = await idQuery.getCount();

    idQuery
      .select('request.id')
      .orderBy('request.createdAt', 'DESC')
      // id tiebreaker: created_at ties would repeat or drop rows across pages.
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
      // Subquery, not join: id query must stay join-free for LIMIT pushdown.
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
      query.andWhere(
        `EXISTS (SELECT 1 FROM jsonb_array_elements_text(${approverValuesSql('request.approvers_snapshot')}) AS approver_value
          WHERE approver_value ILIKE :approver ESCAPE '\\')`,
        { approver: `%${escapeLikePattern(filters.approver)}%` }
      );
    }
  }
}
