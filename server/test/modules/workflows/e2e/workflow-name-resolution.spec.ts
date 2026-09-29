import { INestApplication, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { WorkflowExecutionEdge } from '@entities/workflow_execution_edge.entity';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { AppsRepository } from '@modules/apps/repository';
import { WorkflowApprovalRequestRepository } from '@modules/workflows/repositories/workflow-approval-request.repository';
import { APPROVAL_REMINDER_JOB } from '@modules/workflows/constants';
import { WorkflowSuspendedSignal } from '@modules/workflows/types';
import { WorkflowSchedulerService } from '@ee/workflows/services/workflow-scheduler.service';
import { WorkflowApprovalsService } from '@ee/workflows/services/workflow-approvals.service';
import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';
import { WorkflowExecutionQueueService } from '@ee/workflows/services/workflow-execution-queue.service';
import { WorkflowWebhooksService } from '@ee/workflows/services/workflow-webhooks.service';
import { WorkflowApprovalTimeoutProcessor } from '@ee/workflows/processors/workflow-approval-timeout.processor';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  findEntityOrFail,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
  getDefaultDataSource,
} from 'test-helper';

/**
 * AppsUtilService.create saves every app — workflows included — with apps.name = NULL; the name
 * lives on the canonical app_versions row. createWorkflowForUser writes apps.name, so it is blanked
 * here to match what a real create leaves behind. Every surface below must still show the name.
 */
/** @group workflows */
describe('workflow name resolution when apps.name is empty', () => {
  const WORKFLOW_NAME = 'Versioned name wf';
  let app: INestApplication;
  let userId: string;
  let organizationId: string;
  let workflow: App;
  let version: AppVersion;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    const { user } = await setupOrganizationAndUser(app, {
      email: 'workflow-name-resolution@tooljet.io',
      password: 'password',
      firstName: 'Name',
      lastName: 'Resolution',
    });
    userId = user.id;
    organizationId = user.organizationId;
    workflow = await createWorkflowForUser(app, user, WORKFLOW_NAME);
    version = await createWorkflowApplicationVersion(app, workflow);
    await getDefaultDataSource().getRepository(App).update(workflow.id, { name: null });
    workflow = await findEntityOrFail(App, { id: workflow.id });
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  afterEach(() => jest.restoreAllMocks());

  async function seedPendingApproval() {
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId: version.id,
      startNodeId: null,
      executed: false,
      status: 'waiting',
      executingUserId: userId,
      logs: [],
      organizationId,
      appId: workflow.id,
    });
    const node = await saveEntity(WorkflowExecutionNode, {
      type: 'human',
      executed: false,
      result: '',
      state: {},
      idOnWorkflowDefinition: 'human1',
      workflowExecutionId: execution.id,
      definition: {
        nodeType: 'human',
        nodeName: 'approval1',
        outcomes: [{ key: 'approved' }, { key: 'rejected' }],
        inputSchema: [],
      },
    });
    return saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token: `tok-${Date.now()}-${Math.random()}`,
      status: 'pending',
      approversSnapshot: { users: [], groups: [], emails: [], tokenBypass: true, notificationEmails: ['a@b.test'] },
      expiresAt: null,
      organizationId,
      appId: workflow.id,
      environmentId: version.currentEnvironmentId,
    });
  }

  it('upcoming runs panel shows the workflow name', async () => {
    await saveEntity(WorkflowSchedule, {
      active: true,
      name: 'nightly',
      appId: workflow.id,
      workflowId: version.id,
      environmentId: version.currentEnvironmentId,
      type: 'cron',
      timezone: 'UTC',
      details: { minute: '0', hours: '2', dayOfMonth: '*', month: '*', dayOfWeek: '*' },
      params: null,
    });
    const scheduler = app.get(WorkflowSchedulerService, { strict: false });

    const runs = await scheduler.listUpcomingRuns(organizationId, { appId: workflow.id });

    expect(runs.map((run) => run.workflow)).toEqual([{ id: workflow.id, name: WORKFLOW_NAME }]);
  });

  it('approval resolved audit entry names the workflow', async () => {
    const service = app.get(WorkflowApprovalsService, { strict: false });
    jest.spyOn(app.get(WorkflowExecutionQueueService, { strict: false }), 'enqueue').mockResolvedValue(undefined);
    const emitSpy = jest.spyOn(app.get(EventEmitter2), 'emit');
    const request = await seedPendingApproval();

    await service.resolve(request.token, { outcome: 'approved', input: {} }, { id: userId });

    expect(emitSpy).toHaveBeenCalledWith(
      'auditLogEntry',
      expect.objectContaining({ actionType: 'WORKFLOW_APPROVAL_RESOLVED', resourceName: WORKFLOW_NAME })
    );
  });

  it('approval notification sent on suspend names the workflow', async () => {
    const service = app.get(WorkflowExecutionsService, { strict: false });
    const notify = jest.spyOn(service, 'dispatchApprovalNotification').mockResolvedValue(undefined);
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId: version.id,
      startNodeId: null,
      executed: false,
      status: 'triggered',
      executingUserId: userId,
      logs: [],
    });
    const mk = (type: string, idOnDef: string, definition: Record<string, unknown>) =>
      saveEntity(WorkflowExecutionNode, {
        type,
        executed: false,
        result: '',
        state: {},
        idOnWorkflowDefinition: idOnDef,
        workflowExecutionId: execution.id,
        definition,
      });
    const start = await mk('input', 'start', { nodeType: 'start' });
    const human = await mk('human', 'human1', {
      nodeType: 'human',
      nodeName: 'approval1',
      approvers: { users: [userId], groups: [], dynamic: '', tokenBypass: true },
      outcomes: [{ key: 'approved', label: 'Approve' }],
      inputSchema: [],
      timeout: { enabled: false },
    });
    await saveEntity(WorkflowExecution, { id: execution.id, startNodeId: start.id });
    await saveEntity(WorkflowExecutionEdge, {
      idOnWorkflowDefinition: 'e1',
      workflowExecutionId: execution.id,
      sourceWorkflowExecutionNodeId: start.id,
      targetWorkflowExecutionNodeId: human.id,
      sourceHandle: 'output',
      skipped: false,
    });

    await expect(
      service.execute(await findEntityOrFail(WorkflowExecution, { id: execution.id }), { throwOnError: false })
    ).rejects.toBeInstanceOf(WorkflowSuspendedSignal);

    expect(notify).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      organizationId,
      expect.anything(),
      { workflowName: WORKFLOW_NAME }
    );
  });

  it('approval reminder names the workflow', async () => {
    const executions = { dispatchApprovalNotification: jest.fn() };
    const processor = new WorkflowApprovalTimeoutProcessor(
      app.get(WorkflowApprovalsService, { strict: false }),
      app.get(WorkflowApprovalRequestRepository, { strict: false }),
      executions as unknown as WorkflowExecutionsService,
      { log: jest.fn(), error: jest.fn() } as never,
      app.get(AppsRepository, { strict: false })
    );
    const request = await seedPendingApproval();

    await processor.process({ name: APPROVAL_REMINDER_JOB, data: { requestId: request.id } } as never);

    expect(executions.dispatchApprovalNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      {},
      organizationId,
      version.currentEnvironmentId,
      { reminder: true, workflowName: WORKFLOW_NAME }
    );
  });

  it('webhook unknown-version error names the workflow', async () => {
    const webhooks = app.get(WorkflowWebhooksService, { strict: false });

    const error = await webhooks
      .resolveVersionId(workflow, 'no-such-version', version.currentEnvironmentId)
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(NotFoundException);
    expect(error.message).toBe(`Version "no-such-version" not found for workflow "${WORKFLOW_NAME}"`);
  });
});
