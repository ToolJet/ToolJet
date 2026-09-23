import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { App } from '@entities/app.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { ApprovalListFilters, ApprovalListRow } from '../types/approval-list';

@Injectable()
export class WorkflowApprovalRequestRepository extends Repository<WorkflowApprovalRequest> {
  constructor(private dataSource: DataSource) {
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
   * `organization_id` / `app_id` columns so the (organization_id, created_at DESC) index can
   * serve the ORDER BY + LIMIT directly; the joins below only decorate the current page.
   */
  async listForOrganization(
    organizationId: string,
    filters: ApprovalListFilters,
    page: number,
    perPage: number
  ): Promise<{ rows: ApprovalListRow[]; total: number }> {
    const query = this.createQueryBuilder('request')
      .leftJoinAndMapOne('request.app', App, 'app', 'app.id = request.app_id')
      .leftJoinAndMapOne('request.node', WorkflowExecutionNode, 'node', 'node.id = request.execution_node_id')
      .where('request.organization_id = :organizationId', { organizationId });

    if (filters.statuses?.length) {
      query.andWhere('request.status IN (:...statuses)', { statuses: filters.statuses });
    }
    if (filters.appId) {
      query.andWhere('request.app_id = :appId', { appId: filters.appId });
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

    const [rows, total] = await query
      // Must be the camelCase property path (`createdAt`), not the snake_case column name: with
      // joins + skip/take TypeORM's pagination path resolves this via
      // `metadata.findColumnWithPropertyPath()` and throws on an unmapped property path instead
      // of falling back to the raw string (unlike its non-paginated order-by builder).
      .orderBy('request.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { rows: rows as ApprovalListRow[], total };
  }
}
