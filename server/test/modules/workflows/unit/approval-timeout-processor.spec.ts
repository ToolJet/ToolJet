import { WorkflowApprovalTimeoutProcessor } from '@ee/workflows/processors/workflow-approval-timeout.processor';
import { App } from '@entities/app.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { APPROVAL_DEADLINE_JOB, APPROVAL_REMINDER_JOB } from '@modules/workflows/constants';

/** @group workflows */
describe('WorkflowApprovalTimeoutProcessor', () => {
  it('deadline job calls approvalsService.expire(requestId)', async () => {
    const approvals: any = { expire: jest.fn().mockResolvedValue(undefined) };
    const repo: any = { findOne: jest.fn() };
    const executions: any = { dispatchApprovalNotification: jest.fn() };
    const logger: any = { log: jest.fn(), error: jest.fn() };
    const processor = new WorkflowApprovalTimeoutProcessor(approvals, repo, executions, logger);
    await processor.process({ name: APPROVAL_DEADLINE_JOB, data: { requestId: 'req-1' } } as any);
    expect(approvals.expire).toHaveBeenCalledWith('req-1');
  });

  it('reminder job does nothing when the request is not pending', async () => {
    const approvals: any = { expire: jest.fn() };
    const repo: any = { findOne: jest.fn().mockResolvedValue({ id: 'req-1', status: 'resolved' }) };
    const executions: any = { dispatchApprovalNotification: jest.fn() };
    const logger: any = { log: jest.fn(), error: jest.fn() };
    const processor = new WorkflowApprovalTimeoutProcessor(approvals, repo, executions, logger);
    await processor.process({ name: APPROVAL_REMINDER_JOB, data: { requestId: 'req-1' } } as any);
    expect(executions.dispatchApprovalNotification).not.toHaveBeenCalled();
  });

  it('re-dispatches a pending request as a reminder with its workspace context', async () => {
    const request = {
      id: 'req-1',
      status: 'pending',
      executionNodeId: 'node-1',
      organizationId: 'org-1',
      environmentId: 'env-1',
      appId: 'app-1',
    };
    const node = { definition: { nodeName: 'Manager approval' } };
    const app = { id: 'app-1', name: 'Production deployment' };
    const approvals: any = { expire: jest.fn() };
    const repo: any = {
      findOne: jest.fn().mockResolvedValue(request),
      manager: {
        findOne: jest.fn().mockImplementation((entity) => {
          if (entity === WorkflowExecutionNode) return Promise.resolve(node);
          if (entity === App) return Promise.resolve(app);
          return Promise.resolve(null);
        }),
      },
    };
    const executions: any = { dispatchApprovalNotification: jest.fn() };
    const logger: any = { log: jest.fn(), error: jest.fn() };
    const processor = new WorkflowApprovalTimeoutProcessor(approvals, repo, executions, logger);

    await processor.process({ name: APPROVAL_REMINDER_JOB, data: { requestId: 'req-1' } } as any);

    expect(executions.dispatchApprovalNotification).toHaveBeenCalledWith(
      node.definition,
      request,
      {},
      'org-1',
      'env-1',
      { reminder: true, workflowName: 'Production deployment' }
    );
  });
});
