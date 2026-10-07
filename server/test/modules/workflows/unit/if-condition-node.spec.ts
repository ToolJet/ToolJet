/** @group workflows */
import * as ivm from 'isolated-vm';
import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import {
  getIfConditionBranches,
  IfConditionDefinition,
  selectIfConditionBranch,
} from '@ee/workflows/services/if-condition-node.util';

const evaluateValues = (values: unknown[]) => {
  const remaining = [...values];
  return jest.fn(async () => remaining.shift());
};

describe('If condition node', () => {
  it('keeps legacy nodes on the true and false handles', async () => {
    expect(getIfConditionBranches({ code: 'value' })).toEqual({
      conditions: [{ id: 'true', code: 'value', label: 'If' }],
      elseEnabled: true,
      legacy: true,
    });

    await expect(selectIfConditionBranch({ code: 'value' }, evaluateValues([1]))).resolves.toMatchObject({
      matched: true,
      selectedHandle: 'true',
    });
    await expect(selectIfConditionBranch({ code: 'value' }, evaluateValues([0]))).resolves.toMatchObject({
      matched: false,
      selectedHandle: 'false',
    });
  });

  it.each([
    ['empty array', []],
    ['empty object', {}],
  ])('uses JavaScript truthiness for an %s', async (_description, value) => {
    await expect(selectIfConditionBranch({ code: 'value' }, evaluateValues([value]))).resolves.toMatchObject({
      matched: true,
      selectedHandle: 'true',
      evaluatedValue: value,
    });
  });

  it('selects the first matching else-if branch', async () => {
    const definition: IfConditionDefinition = {
      conditions: [
        { id: 'true', label: 'If', code: 'first' },
        { id: 'else-if-1', label: 'Else if 1', code: 'second' },
        { id: 'else-if-2', label: 'Else if 2', code: 'third' },
      ],
      elseBranch: { enabled: true },
    };
    const evaluate = evaluateValues([false, 'matched', true]);

    await expect(selectIfConditionBranch(definition, evaluate)).resolves.toMatchObject({
      matched: true,
      selectedHandle: 'else-if-1',
      evaluatedValue: 'matched',
    });
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it('selects Else when no condition matches', async () => {
    const definition: IfConditionDefinition = {
      conditions: [{ id: 'true', label: 'If', code: 'first' }],
      elseBranch: { enabled: true },
    };

    await expect(selectIfConditionBranch(definition, evaluateValues([false]))).resolves.toMatchObject({
      matched: false,
      selectedHandle: 'false',
    });
  });

  it('selects no handle for an If-only node when its condition is false', async () => {
    const definition: IfConditionDefinition = {
      conditions: [{ id: 'true', label: 'If', code: 'first' }],
      elseBranch: { enabled: false },
    };

    await expect(selectIfConditionBranch(definition, evaluateValues([false]))).resolves.toMatchObject({
      matched: false,
      selectedHandle: null,
    });
  });

  it('propagates a condition evaluation error without evaluating later branches', async () => {
    const definition: IfConditionDefinition = {
      conditions: [
        { id: 'true', label: 'If', code: 'invalid' },
        { id: 'else-if-1', label: 'Else if 1', code: 'second' },
      ],
      elseBranch: { enabled: true },
    };
    const evaluate = jest.fn().mockRejectedValueOnce(new Error('Invalid condition'));

    await expect(selectIfConditionBranch(definition, evaluate)).rejects.toThrow('Invalid condition');
    expect(evaluate).toHaveBeenCalledTimes(1);
  });
});

describe('WorkflowExecutionsService.processIfConditionNode', () => {
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

  const ifNode = {
    id: 'if1',
    type: 'if-condition',
    definition: { nodeName: 'ifCondition1', conditions: [{ id: 'true', label: 'If', code: 'missingThing.x === 1' }] },
  } as WorkflowExecutionNode;
  const execution = { id: 'execution1', edges: [] } as unknown as WorkflowExecution;

  it('persists a failed evaluation on the node so the editor shows it as failed, not as not run', async () => {
    const service = Object.create(WorkflowExecutionsService.prototype) as WorkflowExecutionsService;
    const completed = jest.spyOn(service, 'completeNodeExecution').mockResolvedValue(undefined);
    const addLog = jest.fn();

    const result = await service.processIfConditionNode(
      ifNode,
      execution,
      {},
      addLog,
      [],
      { startNode: null },
      null,
      isolate,
      context
    );

    expect(result).toMatchObject({ status: 'failed' });
    expect(completed).toHaveBeenCalledWith(
      ifNode,
      expect.stringContaining('missingThing is not defined'),
      expect.objectContaining({ ifCondition1: expect.objectContaining({ status: 'failed' }) }),
      expect.anything()
    );
    expect(addLog).toHaveBeenCalledWith(
      expect.stringContaining('If condition evaluation failed: missingThing is not defined'),
      'ifCondition1',
      'failure',
      expect.anything()
    );
  });
});
