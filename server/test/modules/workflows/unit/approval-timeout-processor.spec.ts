import { WorkflowApprovalTimeoutProcessor } from '@ee/workflows/processors/workflow-approval-timeout.processor';
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
});
