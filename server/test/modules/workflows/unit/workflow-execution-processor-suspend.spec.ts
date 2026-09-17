import { WorkflowExecutionProcessor } from '@ee/workflows/processors/workflow-execution.processor';
import { WorkflowSuspendedSignal } from '@modules/workflows/types';
import { WORKFLOW_EXECUTION_STATUS } from '@modules/workflows/constants';

/** @group workflows */
describe('WorkflowExecutionProcessor — suspend handling', () => {
  it('returns a WAITING result (does not throw) when execute throws WorkflowSuspendedSignal', async () => {
    const execute = jest.fn().mockRejectedValue(new WorkflowSuspendedSignal('exec-1', 'req-1'));
    const service: any = { execute };
    const manager: any = {
      createQueryBuilder: () => ({
        select: () => ({
          innerJoinAndSelect: () => ({
            where: () => ({ getOne: async () => ({ definition: { defaultParams: '{}' } }) }),
          }),
        }),
      }),
    };
    const logger: any = { log: jest.fn(), debug: jest.fn(), error: jest.fn() };
    // terminationRegistry mock: the processor's finally block always calls clear(executionId).
    const terminationRegistry: any = { clear: jest.fn() };
    const processor = new WorkflowExecutionProcessor(service, terminationRegistry, logger, manager);

    const job: any = {
      data: {
        workflowExecution: { id: 'exec-1' },
        createWorkflowExecutionDto: { appId: 'app-1' },
        params: {},
        environmentId: '',
        userId: null,
        metadata: { triggeredBy: 'manual' },
        startNodeId: 'node-1',
        injectedState: { __humanDecision: { outcome: 'approved' } },
      },
      timestamp: Date.now(),
      updateProgress: jest.fn(),
    };

    const result = await processor.process(job);
    expect(result).toMatchObject({
      type: WORKFLOW_EXECUTION_STATUS.WAITING,
      executionId: 'exec-1',
      requestId: 'req-1',
    });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'exec-1' }),
      expect.objectContaining({ startNodeId: 'node-1', injectedState: { __humanDecision: { outcome: 'approved' } } }),
      job
    );
  });
});
