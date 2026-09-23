import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { App } from '@entities/app.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';

export interface ApprovalListFilters {
  statuses?: string[];
  appId?: string;
  /** Free-text match against the approvers snapshot (user id, group id or email). */
  approver?: string;
  from?: Date;
  to?: Date;
}

export interface ApprovalListRow extends WorkflowApprovalRequest {
  app?: App;
  node?: WorkflowExecutionNode;
}
