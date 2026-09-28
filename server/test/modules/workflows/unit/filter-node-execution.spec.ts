import * as ivm from 'isolated-vm';
import * as utils from 'lib/utils';
import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { FILTER_CHECKPOINT_INTERVAL } from '@ee/workflows/services/filter-node.util';

/** @group workflows */
describe('WorkflowExecutionsService.processFilterNode', () => {
  let isolate: ivm.Isolate;
  let context: ivm.Context;

  beforeEach(() => {
    isolate = new ivm.Isolate({ memoryLimit: 20 });
    context = isolate.createContextSync();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    isolate.dispose();
  });

  const filterNode = {
    id: 'filter1',
    type: 'filter',
    definition: { nodeName: 'filter1', inputExpression: 'rows.data', predicateExpression: 'value >= threshold' },
  } as WorkflowExecutionNode;
  const execution = { id: 'execution1', createdAt: new Date() } as WorkflowExecution;

  function buildService(isTerminated = jest.fn().mockResolvedValue(false)) {
    const service = Object.create(WorkflowExecutionsService.prototype) as WorkflowExecutionsService;
    const completed = jest.spyOn(service, 'completeNodeExecution').mockResolvedValue(undefined);
    const fields = service as unknown as Record<string, unknown>;
    fields.terminationRegistry = { isTerminated };
    fields.workflowExecutionTimeout = 60;
    return { service, completed, isTerminated };
  }

  const stateWith = (length: number) => ({
    rows: { data: Array.from({ length }, (_, index) => index) },
    threshold: length - 3,
  });

  it('should keep the matching items, reading other state keys from the predicate', async () => {
    const { service, completed } = buildService();

    const result = await service.processFilterNode(
      filterNode,
      execution,
      stateWith(10),
      jest.fn(),
      null,
      isolate,
      context,
      new Date()
    );

    expect(result).toEqual({ status: 'ok', data: [7, 8, 9] });
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it('should copy the workflow state into the sandbox once, not once per item', async () => {
    const { service } = buildService();
    const resolveCode = jest.spyOn(utils, 'resolveCode');

    await service.processFilterNode(
      filterNode,
      execution,
      stateWith(50),
      jest.fn(),
      null,
      isolate,
      context,
      new Date()
    );

    const statesCopied = resolveCode.mock.calls.map(([call]) => Object.keys(call.state).sort());
    expect(statesCopied[0]).toEqual(['rows', 'threshold']);
    expect(statesCopied.slice(1)).toHaveLength(50);
    expect(statesCopied.slice(1).every((keys) => keys.join() === 'index,value')).toBe(true);
  });

  it('should stop with a failed result when the execution is terminated mid-filter', async () => {
    const isTerminated = jest.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const { service, completed } = buildService(isTerminated);
    const addLog = jest.fn();

    const result = await service.processFilterNode(
      filterNode,
      execution,
      stateWith(FILTER_CHECKPOINT_INTERVAL * 3),
      addLog,
      null,
      isolate,
      context,
      new Date()
    );

    expect(result).toMatchObject({ status: 'failed' });
    expect(isTerminated).toHaveBeenCalledTimes(2);
    expect(completed).not.toHaveBeenCalled();
    expect(addLog).toHaveBeenCalledWith(
      expect.stringContaining('Workflow execution terminated'),
      'filter1',
      'failure',
      expect.anything()
    );
  });

  it('should stop with a failed result once the workflow timeout has passed', async () => {
    const { service, isTerminated } = buildService();
    const startedLongAgo = new Date(Date.now() - 61_000);

    const result = await service.processFilterNode(
      filterNode,
      execution,
      stateWith(5),
      jest.fn(),
      null,
      isolate,
      context,
      startedLongAgo
    );

    expect(result).toMatchObject({ status: 'failed' });
    expect(isTerminated).not.toHaveBeenCalled();
  });
});
