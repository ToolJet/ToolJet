/** @group workflows */
import { Queue } from 'bullmq';
import { Logger } from 'nestjs-pino';
import { EntityManager } from 'typeorm';
import { WorkflowExecutionQueueService } from '@ee/workflows/services/workflow-execution-queue.service';
import { WorkflowTerminationRegistry } from '@ee/workflows/services/workflow-termination-registry';
import { WorkflowExecution } from '@entities/workflow_execution.entity';

// terminate() is the Stop button behind the executions dashboard. finishedAt has to land on every
// terminal path it can take, but terminate() is re-enterable for the same execution (a retried or
// double-clicked Stop call re-runs the same branch once status is already 'terminated'), so the
// update must guard finishedAt with COALESCE rather than overwrite it with a fresh Date on every
// call -- otherwise the dashboard's Duration column would keep moving forward on repeat clicks.
//
// executed: true must land alongside status: 'terminated' on every path too: the dashboard's
// renderer (getExecutionDisplayState) only recognises status: 'terminated' as terminal when
// executed is also true; without it, a filtered-for-"Terminated" row falls through to job state
// and renders as "Unknown" once BullMQ evicts the job.
describe('WorkflowExecutionQueueService.terminate', () => {
  const executionId = 'execution-1';

  const makeService = () => {
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    const findOne = jest.fn();
    const entityManager = { findOne, update } as unknown as EntityManager;

    const getJob = jest.fn();
    const getDelayed = jest.fn().mockResolvedValue([]);
    const executionQueue = { getJob, getDelayed } as unknown as Queue;

    const terminationRegistry = {
      requestTermination: jest.fn().mockResolvedValue(undefined),
    } as unknown as WorkflowTerminationRegistry;

    const logger = { log: jest.fn(), error: jest.fn() } as unknown as Logger;

    const service = new WorkflowExecutionQueueService(executionQueue, terminationRegistry, logger, entityManager);

    return { service, entityManager, update, findOne, executionQueue, getJob, terminationRegistry };
  };

  // Every assertion below checks that `finishedAt` is passed as a function (a raw SQL fragment,
  // per TypeORM's QueryBuilder.set() convention) rather than a literal `Date`, since a literal
  // value would overwrite an already-recorded finish time on a repeat call.
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
    // Simulates the re-entrant path: the first call already wrote status: 'terminated', so a
    // second call for the same execution finds no waiting job and no BullMQ job either, landing
    // on the "sync" branch a second time. The update must still guard finishedAt with COALESCE.
    const { service, findOne, getJob, update } = makeService();
    findOne.mockResolvedValue({ id: executionId, status: 'terminated' } as WorkflowExecution);
    getJob.mockResolvedValue(undefined);

    await service.terminate(executionId);

    const [, , payload] = update.mock.calls[0];
    expect(payload.executed).toBe(true);
    expect(typeof payload.finishedAt).toBe('function');
    expect(payload.finishedAt()).toMatch(/COALESCE\(finished_at, ?NOW\(\)\)/i);
  });
});
