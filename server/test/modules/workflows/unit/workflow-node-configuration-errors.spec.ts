import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { WorkflowExecutionEdge } from '@entities/workflow_execution_edge.entity';
import { AppVersion } from '@entities/app_version.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { parse } from 'flatted';

jest.mock('src/helpers/database.helper', () => ({
  ...jest.requireActual('src/helpers/database.helper'),
  dbTransactionWrap: jest.fn(),
}));

function node(type: string, definition: Record<string, unknown>, id = 'node1'): WorkflowExecutionNode {
  return { id, idOnWorkflowDefinition: id, type, definition, executed: false } as WorkflowExecutionNode;
}

function edge(source: string, target: string, sourceHandle = 'success'): WorkflowExecutionEdge {
  return {
    sourceWorkflowExecutionNodeId: source,
    targetWorkflowExecutionNodeId: target,
    sourceHandle,
    skipped: false,
  } as WorkflowExecutionEdge;
}

function buildExecution(
  nodeToRun: WorkflowExecutionNode,
  otherNodes: WorkflowExecutionNode[] = [],
  edges: WorkflowExecutionEdge[] = []
) {
  const execution = {
    id: 'execution1',
    appVersionId: 'version1',
    createdAt: new Date(),
    startNode: nodeToRun,
    nodes: [nodeToRun, ...otherNodes],
    edges,
    logs: [],
    executingUserId: 'user1',
  } as WorkflowExecution;
  const appVersion = {
    id: 'version1',
    app: { id: 'app1', organizationId: 'org1', name: 'Test workflow', isMaintenanceOn: true },
    definition: { queries: [] },
  } as unknown as AppVersion;
  const service = Object.create(WorkflowExecutionsService.prototype) as WorkflowExecutionsService;
  const completed = jest.spyOn(service, 'completeNodeExecution').mockResolvedValue(undefined);
  const recalculate = jest.spyOn(service, 'recalculateQueue').mockImplementation(() => undefined);
  const savedStatus = jest.spyOn(service, 'saveExecutionStatus').mockResolvedValue(undefined);
  jest.spyOn(service, 'markWorkflowAsExecuted').mockResolvedValue(undefined);
  jest.spyOn(service, 'makeAuditLogCall').mockResolvedValue(undefined);
  jest.spyOn(service, 'getStateAndPreviousNodesExecutionCompletionStatus').mockResolvedValue({
    state: {},
    previousNodesExecutionCompletionStatus: true,
  });
  jest.spyOn(service, 'findOne').mockResolvedValue(execution);
  const serviceFields = service as unknown as Record<string, unknown>;
  serviceFields.appEnvironmentUtilService = { resolveEnvironmentId: jest.fn().mockResolvedValue('') };
  serviceFields.organizationConstantsService = { getConstantsForEnvironment: jest.fn().mockResolvedValue([]) };
  serviceFields.appVersionsRepository = { findOne: jest.fn().mockResolvedValue(appVersion) };
  serviceFields.licenseTermsService = { getLicenseTerms: jest.fn().mockResolvedValue({ execution_timeout: 60 }) };
  serviceFields.jsBundleGenerationService = { getBundleForExecution: jest.fn().mockResolvedValue(null) };
  serviceFields.pyBundleGenerationService = { getBundleForExecution: jest.fn().mockResolvedValue(null) };
  serviceFields.workflowExecutionNodeRepository = {
    findOne: jest
      .fn()
      .mockImplementation(({ where }) =>
        Promise.resolve(execution.nodes.find((candidate) => candidate.id === where.id))
      ),
  };
  serviceFields.workflowApprovalRequestRepository = { create: jest.fn(), save: jest.fn() };
  serviceFields.workflowApprovalTimeoutService = { scheduleTimers: jest.fn() };
  serviceFields.workflowExecutionQueueService = { enqueue: jest.fn() };
  serviceFields.terminationRegistry = { isTerminated: jest.fn().mockResolvedValue(false) };
  serviceFields.logger = { error: jest.fn(), warn: jest.fn(), log: jest.fn(), debug: jest.fn() };
  return { service, execution, completed, recalculate, savedStatus, serviceFields };
}

/** @group workflows */
describe('WorkflowExecutionsService | reached node configuration errors', () => {
  beforeEach(() => {
    (dbTransactionWrap as jest.Mock).mockImplementation(async (action: (manager: unknown) => Promise<unknown>) =>
      action({
        createQueryBuilder: () => ({
          innerJoin() {
            return this;
          },
          where() {
            return this;
          },
          getOne: async () => ({ id: 'org1' }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      })
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('fails a blank Loop expression before the Query processor can choose a failure edge', async () => {
    const loop = node('query', { nodeName: 'loop1', looped: true, iterationValuesCode: '  ', errorHandler: true });
    const successEdge = edge(loop.id, 'success', 'success');
    const failureEdge = edge(loop.id, 'failure', 'failure');
    const { service, execution, completed, recalculate, savedStatus } = buildExecution(
      loop,
      [],
      [successEdge, failureEdge]
    );
    const processor = jest.spyOn(service, 'processQueryNode').mockRejectedValue(new Error('Query processor reached'));

    const result = await service.execute(execution);

    expect(result).toMatchObject({ status: 'failed', exception: { node_failed: 'loop1', statusCode: 400 } });
    expect(completed).toHaveBeenCalledWith(loop, expect.any(String), expect.any(Object), expect.any(Object));
    expect(parse(completed.mock.calls[0][1])).toMatchObject({ status: 'failed', exception: { node_failed: 'loop1' } });
    expect(savedStatus).toHaveBeenCalledWith(expect.objectContaining({ executionFailed: true }));
    expect(savedStatus.mock.calls[0][0].logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Configuration error: Loop array expression cannot be empty',
          status: 'failure',
          error: expect.objectContaining({ node_failed: 'loop1' }),
        }),
      ])
    );
    expect(processor).not.toHaveBeenCalled();
    expect(recalculate).not.toHaveBeenCalled();
    expect(successEdge.skipped).toBe(false);
    expect(failureEdge.skipped).toBe(false);
  });

  it.each([
    [
      { nodeName: 'approval1', approvers: { users: [], groups: [], tokenBypass: false }, outcomes: [{ key: 'yes' }] },
      'Human approval requires at least one approver when token bypass is disabled',
    ],
    [
      { nodeName: 'approval1', approvers: { tokenBypass: true }, outcomes: [] },
      'Human approval requires at least one outcome',
    ],
  ])('fails invalid Human configuration before creating a request: %s', async (definition, message) => {
    const human = node('human', definition);
    const { service, execution, serviceFields, savedStatus } = buildExecution(human);
    jest.spyOn(service, 'processHumanNode').mockRejectedValue(new Error('Human processor reached'));

    const result = await service.execute(execution);

    expect(result).toMatchObject({ status: 'failed', exception: { message } });
    expect((serviceFields.workflowApprovalRequestRepository as { save: jest.Mock }).save).not.toHaveBeenCalled();
    expect(
      (serviceFields.workflowApprovalTimeoutService as { scheduleTimers: jest.Mock }).scheduleTimers
    ).not.toHaveBeenCalled();
    expect(savedStatus).toHaveBeenCalledWith(expect.objectContaining({ executionFailed: true }));
  });

  it('fails invalid Wait duration before enqueueing a resume job', async () => {
    const wait = node('wait', { nodeName: 'delay1', durationSeconds: 0 });
    const { service, execution, serviceFields } = buildExecution(wait);

    const result = await service.execute(execution);

    expect(result).toMatchObject({ status: 'failed', exception: { node_failed: 'delay1' } });
    expect((serviceFields.workflowExecutionQueueService as { enqueue: jest.Mock }).enqueue).not.toHaveBeenCalled();
  });

  it('fails a Filter with no upstream input before evaluating its expressions', async () => {
    const filter = node('filter', { nodeName: 'filter1', inputExpression: 'items', predicateExpression: 'value' });
    const { service, execution, recalculate } = buildExecution(filter);
    const processor = jest.spyOn(service, 'processFilterNode').mockRejectedValue(new Error('Filter processor reached'));

    const result = await service.execute(execution);

    expect(result).toMatchObject({
      status: 'failed',
      exception: { message: 'Filter requires one upstream input connection', node_failed: 'filter1' },
    });
    expect(processor).not.toHaveBeenCalled();
    expect(recalculate).not.toHaveBeenCalled();
  });

  it('keeps a non-array Loop runtime result on the existing Query failure edge', async () => {
    const loop = node('query', {
      nodeName: 'loop1',
      idOnDefinition: 'query1',
      looped: true,
      iterationValuesCode: 'return 42;',
    });
    const successEdge = edge(loop.id, 'success', 'success');
    const failureEdge = edge(loop.id, 'failure', 'failure');
    const { service, execution, completed, recalculate, serviceFields } = buildExecution(
      loop,
      [],
      [successEdge, failureEdge]
    );
    serviceFields.dataQueryRepository = {
      findOneOrFail: jest.fn().mockResolvedValue({ id: 'query-row', name: 'loop1', kind: 'runjs' }),
    };
    serviceFields.userRepository = { findOne: jest.fn().mockResolvedValue({ id: 'user1' }) };
    const appVersion = await (serviceFields.appVersionsRepository as { findOne: jest.Mock }).findOne();
    appVersion.definition.queries = [{ id: 'query-row', idOnDefinition: 'query1' }];
    const addLog = jest.fn();

    const result = await service.processQueryNode(
      loop,
      execution,
      appVersion,
      {},
      addLog,
      null,
      [],
      execution.createdAt,
      { startNode: loop }
    );

    expect(result).toMatchObject({ status: 'failed' });
    expect(completed).toHaveBeenCalledTimes(1);
    expect(successEdge.skipped).toBe(true);
    expect(failureEdge.skipped).toBe(false);
    expect(recalculate).toHaveBeenCalledTimes(1);
  });

  it('lets a Human decision resume pass even if first-entry configuration was removed', async () => {
    const human = node('human', { nodeName: 'approval1', outcomes: [] });
    const { service, execution } = buildExecution(human);
    const processor = jest.spyOn(service, 'processHumanNode').mockResolvedValue({ status: 'ok', data: {} });

    await service.execute(execution, {
      startNodeId: human.id,
      injectedState: { __humanDecision: { nodeId: human.id, outcome: 'yes' } },
    });

    expect(processor).toHaveBeenCalledTimes(1);
  });

  it('fails a Human node when a decision marker belongs to another node', async () => {
    const human = node('human', { nodeName: 'approval1', outcomes: [] });
    const { service, execution } = buildExecution(human);
    const processor = jest.spyOn(service, 'processHumanNode').mockResolvedValue({ status: 'ok', data: {} });

    const result = await service.execute(execution, {
      startNodeId: human.id,
      injectedState: { __humanDecision: { nodeId: 'other-node', outcome: 'yes' } },
    });

    expect(result).toMatchObject({ status: 'failed' });
    expect(processor).not.toHaveBeenCalled();
  });

  it('lets a matching Wait resume pass even if its duration was removed', async () => {
    const wait = node('wait', { nodeName: 'delay1' });
    const { service, execution } = buildExecution(wait);
    const processor = jest.spyOn(service, 'processWaitNode').mockResolvedValue({ status: 'ok', data: {} });

    await service.execute(execution, { startNodeId: wait.id, injectedState: { __waitResume: { nodeId: wait.id } } });

    expect(processor).toHaveBeenCalledTimes(1);
  });

  it('fails a Wait node when a resume marker belongs to another node', async () => {
    const wait = node('wait', { nodeName: 'delay1' });
    const { service, execution } = buildExecution(wait);
    const processor = jest.spyOn(service, 'processWaitNode').mockResolvedValue({ status: 'ok', data: {} });

    const result = await service.execute(execution, {
      startNodeId: wait.id,
      injectedState: { __waitResume: { nodeId: 'other-node' } },
    });

    expect(result).toMatchObject({ status: 'failed' });
    expect(processor).not.toHaveBeenCalled();
  });

  it('follows the failure edge of a failed Run Workflow node that has error handling', async () => {
    const workflowNode = node('workflow', { nodeName: 'workflows1', errorHandler: true }, 'workflow1');
    const onFailure = node('query', { nodeName: 'onFailure' }, 'onFailure');
    const { service, execution, savedStatus } = buildExecution(
      workflowNode,
      [onFailure],
      [edge(workflowNode.id, onFailure.id, 'failure')]
    );
    jest.spyOn(service, 'processWorkflowNode').mockResolvedValue({ status: 'failed', data: undefined });
    const processQuery = jest.spyOn(service, 'processQueryNode').mockResolvedValue({ status: 'ok', data: undefined });

    await service.execute(execution);

    expect(processQuery.mock.calls[0][0]).toBe(onFailure);
    expect(savedStatus).toHaveBeenCalledWith(expect.objectContaining({ executionFailed: false }));
  });

  it('stops the run when a Run Workflow node without error handling fails', async () => {
    const workflowNode = node('workflow', { nodeName: 'workflows1' }, 'workflow1');
    const next = node('query', { nodeName: 'next' }, 'next');
    const { service, execution, savedStatus } = buildExecution(
      workflowNode,
      [next],
      [edge(workflowNode.id, next.id, 'success')]
    );
    jest.spyOn(service, 'processWorkflowNode').mockResolvedValue({ status: 'failed', data: undefined });
    const processQuery = jest.spyOn(service, 'processQueryNode').mockResolvedValue({ status: 'ok', data: undefined });

    await service.execute(execution);

    expect(processQuery).not.toHaveBeenCalled();
    expect(savedStatus).toHaveBeenCalledWith(expect.objectContaining({ executionFailed: true }));
  });

  it('does not validate a node outside the computed execution queue', async () => {
    const start = node('input', { nodeName: 'startTrigger' }, 'start');
    const unreachable = node(
      'query',
      { nodeName: 'unreachable', looped: true, iterationValuesCode: '' },
      'unreachable'
    );
    const { service, execution, completed, savedStatus } = buildExecution(start, [unreachable]);
    jest.spyOn(service, 'processStartNode').mockResolvedValue({ status: 'ok', data: undefined });

    await service.execute(execution);

    expect(completed).not.toHaveBeenCalledWith(unreachable, expect.anything(), expect.anything(), expect.anything());
    expect(savedStatus).toHaveBeenCalledWith(expect.objectContaining({ executionFailed: false }));
  });
});
