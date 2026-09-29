/** @group workflows */
import { Queue } from 'bullmq';
import { Logger } from 'nestjs-pino';
import { EntityManager } from 'typeorm';
import { WorkflowExecutionQueueService } from '@ee/workflows/services/workflow-execution-queue.service';
import { WorkflowTerminationRegistry } from '@ee/workflows/services/workflow-termination-registry';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowApprovalTimeoutService } from '@ee/workflows/services/workflow-approval-timeout.service';

describe('WorkflowExecutionQueueService.terminate', () => {
  const executionId = 'execution-1';

  const makeService = () => {
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    const findOne = jest.fn();
    const find = jest.fn().mockResolvedValue([]);
    const entityManager = { findOne, find, update } as unknown as EntityManager;

    const getJob = jest.fn();
    const getDelayed = jest.fn().mockResolvedValue([]);
    const executionQueue = { getJob, getDelayed } as unknown as Queue;

    const terminationRegistry = {
      requestTermination: jest.fn().mockResolvedValue(undefined),
    } as unknown as WorkflowTerminationRegistry;

    const logger = { log: jest.fn(), error: jest.fn() } as unknown as Logger;

    const cancelTimers = jest.fn().mockResolvedValue(undefined);
    const approvalTimeoutService = { cancelTimers } as unknown as WorkflowApprovalTimeoutService;

    const service = new WorkflowExecutionQueueService(
      executionQueue,
      terminationRegistry,
      logger,
      entityManager,
      approvalTimeoutService
    );

    return { service, entityManager, update, find, findOne, executionQueue, getJob, terminationRegistry, cancelTimers };
  };

  const rawSqlFinishedAt = expect.any(Function);

  it('stamps finishedAt when terminating a running (active BullMQ job) execution', async () => {
    const { service, findOne, getJob, update } = makeService();
    findOne.mockResolvedValue({ id: executionId, status: 'running' } as WorkflowExecution);
    getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('active'),
      updateProgress: jest.fn().mockResolvedValue(undefined),
    });

    const result = await service.terminate(executionId);

    expect(result).toEqual({ success: true, previousState: 'active' });
    expect(update).toHaveBeenCalledWith(
      WorkflowExecution,
      { id: executionId },
      expect.objectContaining({ status: 'terminated', executed: true, finishedAt: rawSqlFinishedAt })
    );
  });

  it('stamps finishedAt when terminating a suspended (waiting) execution', async () => {
    const { service, findOne, update } = makeService();
    findOne.mockResolvedValue({ id: executionId, status: 'waiting' } as WorkflowExecution);

    const result = await service.terminate(executionId);

    expect(result).toEqual({ success: true, previousState: 'waiting' });
    expect(update).toHaveBeenCalledWith(
      WorkflowExecution,
      { id: executionId },
      expect.objectContaining({ status: 'terminated', executed: true, finishedAt: rawSqlFinishedAt })
    );
  });

  it('stamps finishedAt when terminating a sync execution with no BullMQ job', async () => {
    const { service, findOne, getJob, update } = makeService();
    findOne.mockResolvedValue({ id: executionId, status: 'running' } as WorkflowExecution);
    getJob.mockResolvedValue(undefined);

    const result = await service.terminate(executionId);

    expect(result).toEqual({ success: true, previousState: 'sync' });
    expect(update).toHaveBeenCalledWith(
      WorkflowExecution,
      { id: executionId },
      expect.objectContaining({ status: 'terminated', executed: true, finishedAt: rawSqlFinishedAt })
    );
  });

  it('does not overwrite finishedAt with a plain literal on a repeat Stop call', async () => {
    const { service, findOne, getJob, update } = makeService();
    findOne.mockResolvedValue({ id: executionId, status: 'terminated' } as WorkflowExecution);
    getJob.mockResolvedValue(undefined);

    await service.terminate(executionId);

    const [, , payload] = update.mock.calls[0];
    expect(payload.executed).toBe(true);
    expect(typeof payload.finishedAt).toBe('function');
    expect(payload.finishedAt()).toMatch(/COALESCE\(finished_at, ?NOW\(\)\)/i);
  });

  it('cancels the pending approval request and its timers when terminating a waiting execution', async () => {
    const { service, findOne, find, update, cancelTimers } = makeService();
    findOne.mockResolvedValue({ id: executionId, status: 'waiting' } as WorkflowExecution);
    const definition = { reminders: [{ afterSeconds: 60 }] };
    find.mockResolvedValue([{ id: 'request-1', executionNode: { definition } }]);

    await service.terminate(executionId);

    expect(update).toHaveBeenCalledWith(
      WorkflowApprovalRequest,
      { workflowExecutionId: executionId, status: 'pending' },
      expect.objectContaining({ status: 'cancelled', resolvedAt: expect.any(Date) })
    );
    expect(cancelTimers).toHaveBeenCalledWith('request-1', definition);
  });

  it('flags a waiting execution for termination so a resume already in flight stops at its next node', async () => {
    // A resumed run keeps status 'waiting' until it finishes, and its job id is
    // `${executionId}-resume-${requestId}`, so only the termination flag reaches it.
    const { service, findOne, terminationRegistry } = makeService();
    findOne.mockResolvedValue({ id: executionId, status: 'waiting' } as WorkflowExecution);

    await service.terminate(executionId);

    expect(terminationRegistry.requestTermination).toHaveBeenCalledWith(executionId);
  });
});
