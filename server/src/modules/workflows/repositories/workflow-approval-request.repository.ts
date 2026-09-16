import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';

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
}
