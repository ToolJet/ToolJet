import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';
import { WorkflowWebhooksService } from '@ee/workflows/services/workflow-webhooks.service';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { AppVersion } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';
import { WORKFLOW_TRIGGER_TYPE, WorkflowTriggerType } from '@modules/workflows/types';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { parse } from 'flatted';

jest.mock('src/helpers/database.helper', () => ({
  ...jest.requireActual('src/helpers/database.helper'),
  dbTransactionWrap: jest.fn(),
}));

function fixture(definition: Record<string, unknown> = {}, triggerType: WorkflowTriggerType = 'manual') {
  const start = {
    id: 'start',
    idOnWorkflowDefinition: 'start',
    type: 'input',
    definition: {},
  } as WorkflowExecutionNode;
  const downstream = {
    id: 'query',
    idOnWorkflowDefinition: 'query',
    type: 'query',
    definition: { nodeName: 'query1' },
  } as WorkflowExecutionNode;
  const execution = {
    id: 'execution',
    appVersionId: 'pinned-version',
    createdAt: new Date(),
    triggerType,
    startNode: start,
    nodes: [start, downstream],
    logs: [],
    edges: [{ sourceWorkflowExecutionNodeId: start.id, targetWorkflowExecutionNodeId: downstream.id }],
  } as WorkflowExecution;
  const appVersion = {
    id: 'pinned-version',
    definition,
    app: { id: 'app', organizationId: 'org', isMaintenanceOn: true },
  } as unknown as AppVersion;
  const service = Object.create(WorkflowExecutionsService.prototype) as WorkflowExecutionsService;
  const completed = jest.spyOn(service, 'completeNodeExecution').mockResolvedValue(undefined);
  const savedStatus = jest.spyOn(service, 'saveExecutionStatus').mockResolvedValue(undefined);
  jest.spyOn(service, 'markWorkflowAsExecuted').mockResolvedValue(undefined);
  jest.spyOn(service, 'makeAuditLogCall').mockResolvedValue(undefined);
  jest.spyOn(service, 'findOne').mockResolvedValue(execution);
  jest.spyOn(service, 'getStateAndPreviousNodesExecutionCompletionStatus').mockImplementation(async (node) => ({
    state: node.id === start.id ? {} : (completed.mock.calls[0]?.[2] ?? {}),
    previousNodesExecutionCompletionStatus: true,
  }));
  const query = jest.spyOn(service, 'processQueryNode').mockResolvedValue({ status: 'ok', data: undefined });
  Object.assign(service, {
    appEnvironmentUtilService: { resolveEnvironmentId: jest.fn().mockResolvedValue('') },
    organizationConstantsService: { getConstantsForEnvironment: jest.fn().mockResolvedValue([]) },
    appVersionsRepository: { findOne: jest.fn().mockResolvedValue(appVersion) },
    licenseTermsService: { getLicenseTerms: jest.fn().mockResolvedValue({ execution_timeout: 60 }) },
    jsBundleGenerationService: { getBundleForExecution: jest.fn().mockResolvedValue(null) },
    pyBundleGenerationService: { getBundleForExecution: jest.fn().mockResolvedValue(null) },
    workflowExecutionNodeRepository: {
      findOne: jest
        .fn()
        .mockImplementation(({ where }) => Promise.resolve(execution.nodes.find((n) => n.id === where.id))),
    },
    logger: { error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
  });
  return { service, execution, start, completed, savedStatus, query };
}

/** @group workflows */
describe('Workflow Start input validation', () => {
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
          getOne: async () => ({ id: 'org' }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      })
    );
  });
  afterEach(() => jest.clearAllMocks());

  it.each(['manual', 'schedule', 'webhook', 'app', 'workflow'] as const)(
    'persists a required input failure on reached Start and stops downstream for %s',
    async (trigger) => {
      const { service, execution, completed, savedStatus, query } = fixture(
        {
          workflowInputs: [{ key: 'region', type: 'string', required: true }],
        },
        trigger
      );
      const result = await service.execute(execution, { params: {} });
      expect(result).toMatchObject({ status: 'failed', exception: { node_failed: 'startTrigger', statusCode: 400 } });
      expect(parse(completed.mock.calls[0][1])).toMatchObject({
        status: 'failed',
        exception: { message: 'Parameter "region" is required', node_failed: 'startTrigger' },
      });
      expect(savedStatus.mock.calls[0][0]).toMatchObject({
        executionFailed: true,
        logs: [
          expect.objectContaining({
            message: 'Start node execution failed: Parameter "region" is required',
            handle: 'startTrigger',
            status: 'failure',
          }),
        ],
      });
      expect(query).not.toHaveBeenCalled();
    }
  );

  it.each([
    [{}, { region: 'US', limit: 10 }],
    [
      { region: 'EU', limit: 0 },
      { region: 'EU', limit: 0 },
    ],
  ])('uses typed defaults and explicit overrides in downstream state: %p', async (params, expected) => {
    const { service, execution, completed, query } = fixture({
      workflowInputs: [
        { key: 'region', type: 'string', required: true, defaultValue: 'US' },
        { key: 'limit', type: 'number', required: true, defaultValue: 10 },
      ],
    });
    await service.execute(execution, { params });
    expect(completed.mock.calls[0][2]).toEqual({ startTrigger: { params: expected } });
    expect(query.mock.calls[0][3]).toMatchObject({ startTrigger: { params: expected } });
  });

  it('fails a wrong explicit type on Start instead of falling back to its default', async () => {
    const { service, execution, query } = fixture({
      workflowInputs: [{ key: 'limit', type: 'number', required: true, defaultValue: 10 }],
    });
    await expect(service.execute(execution, { params: { limit: '10' }, throwOnError: true })).rejects.toMatchObject({
      node_failed: 'startTrigger',
      message: 'Parameter "limit" has an incorrect datatype',
      statusCode: 400,
    });
    expect(query).not.toHaveBeenCalled();
  });

  it.each(['manual', 'schedule', 'app'] as const)(
    'merges legacy defaults for %s, ignoring webhook requirements',
    async (trigger) => {
      const { service, execution, completed } = fixture(
        {
          defaultParams: '{"region":"US","limit":10}',
          webhookParams: [{ key: 'missing', dataType: 'string' }],
        },
        trigger
      );
      await service.execute(execution, { params: { region: 'EU' } });
      expect(completed.mock.calls[0][2]).toEqual({ startTrigger: { params: { region: 'EU', limit: 10 } } });
    }
  );

  it('retains legacy required webhook parameters at Start', async () => {
    const { service, execution } = fixture({ webhookParams: [{ key: 'region', dataType: 'string' }] }, 'webhook');
    await expect(service.execute(execution, { throwOnError: true })).rejects.toMatchObject({
      message: 'Parameter "region" is required',
      node_failed: 'startTrigger',
    });
  });

  it.each([
    [{}, { region: 'US', limit: 10 }],
    [{ region: 'EU' }, { region: 'EU' }],
  ])('preserves child workflow legacy replacement precedence: %p', async (params, expected) => {
    const { service, execution, completed } = fixture(
      { defaultParams: '{"region":"US","limit":10}' },
      WORKFLOW_TRIGGER_TYPE.WORKFLOW
    );
    await service.execute(execution, { params });
    expect(completed.mock.calls[0][2]).toEqual({ startTrigger: { params: expected } });
  });

  it('keeps explicit empty workflowInputs distinct from legacy inputs', async () => {
    const { service, execution, completed } = fixture({ workflowInputs: [], defaultParams: '{"limit":10}' });
    await service.execute(execution, { params: { region: 'EU' } });
    expect(completed.mock.calls[0][2]).toEqual({ startTrigger: { params: {} } });
  });

  it('uses typed defaults without parsing obsolete legacy defaults', async () => {
    const { service, execution, completed } = fixture({
      workflowInputs: [{ key: 'region', type: 'string', required: true, defaultValue: 'US' }],
      defaultParams: '{invalid legacy JSON',
    });
    await service.execute(execution, { params: {} });
    expect(completed.mock.calls[0][2]).toEqual({ startTrigger: { params: { region: 'US' } } });
  });

  it('returns the legacy webhook HTTP 400 after Start persists a validation failure', async () => {
    const { service, execution, completed } = fixture(
      { webhookParams: [{ key: 'region', dataType: 'string' }] },
      WORKFLOW_TRIGGER_TYPE.WEBHOOK
    );
    const webhookService = Object.create(WorkflowWebhooksService.prototype) as WorkflowWebhooksService;
    const create = jest.fn().mockResolvedValue(execution);
    const execute = jest.fn((run, options) => service.execute(run, options));
    Object.assign(webhookService, {
      manager: { findOne: jest.fn().mockResolvedValue({ id: 'pinned-version' }) },
      workflowExecutionsService: { create, execute },
      workflowVersionUtilService: { validateVersionEnvironmentCompatibility: jest.fn() },
      logger: { debug: jest.fn() },
    });
    jest.spyOn(webhookService, 'getEnvironmentId').mockResolvedValue('');

    await expect(
      webhookService.triggerWorkflow(
        { id: 'app', currentVersionId: 'pinned-version' } as App,
        { region: 42 },
        'development',
        undefined,
        {}
      )
    ).rejects.toMatchObject({ status: 400, message: 'Parameter "region" has an incorrect datatype' });
    expect(create).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][1]).toMatchObject({ params: { region: 42 } });
    expect(parse(completed.mock.calls[0][1])).toMatchObject({
      status: 'failed',
      exception: { node_failed: 'startTrigger' },
    });
  });

  it('does not validate Start inputs when resuming a later node', async () => {
    const { service, execution, completed, query } = fixture({
      workflowInputs: [{ key: 'region', type: 'string', required: true }],
    });
    await service.execute(execution, { startNodeId: 'query', injectedState: { __humanDecision: { outcome: 'yes' } } });
    expect(completed).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(1);
  });
});
