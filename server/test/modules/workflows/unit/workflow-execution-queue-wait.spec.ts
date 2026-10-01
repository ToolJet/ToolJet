/** @group workflows */
import { Queue } from 'bullmq';
import { Logger } from 'nestjs-pino';
import { EntityManager } from 'typeorm';
import { WorkflowExecutionQueueService } from '@ee/workflows/services/workflow-execution-queue.service';
import { WorkflowTerminationRegistry } from '@ee/workflows/services/workflow-termination-registry';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { EXECUTION_JOB } from '@modules/workflows/constants';

describe('WorkflowExecutionQueueService | durable Wait resumes', () => {
  const add = jest.fn();
  const queue = { add } as unknown as Queue;
  const terminationRegistry = {} as WorkflowTerminationRegistry;
  const logger = { log: jest.fn() } as unknown as Logger;
  const entityManager = {} as EntityManager;
  const service = new WorkflowExecutionQueueService(queue, terminationRegistry, logger, entityManager);

  beforeEach(() => jest.clearAllMocks());

  it('should enqueue a delayed, uniquely identified resume job', async () => {
    const execution = { id: 'execution-1' } as WorkflowExecution;

    await service.enqueue(
      execution,
      {
        appId: 'app-1',
        appVersionId: 'version-1',
        params: {},
        environmentId: 'environment-1',
        userId: 'user-1',
      },
      'manual',
      0,
      undefined,
      {
        startNodeId: 'node-1',
        requestId: 'wait-node-1-123',
        delayMs: 5000,
        injectedState: { __waitResume: { nodeId: 'node-1' } },
      }
    );

    expect(add).toHaveBeenCalledWith(
      EXECUTION_JOB,
      expect.objectContaining({
        startNodeId: 'node-1',
        injectedState: { __waitResume: { nodeId: 'node-1' } },
      }),
      expect.objectContaining({
        jobId: 'execution-1-resume-wait-node-1-123',
        delay: 5000,
      })
    );
  });
});
